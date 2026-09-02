import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// ============================================================
// Input Sanitization Middleware
// ============================================================

// Strip potential XSS from string inputs
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  // Remove script tags and event handlers
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["']?[^"'\s>]*["']?/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

// Recursively sanitize all string values in an object
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Block prototype pollution vectors
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

// Sanitize request body, query, and params
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

// ============================================================
// Organization Isolation Middleware (IDOR Prevention)
// ============================================================

// Ensure the authenticated user can only access their own organization's data
export function requireOrganizationAccess(req: any, _res: Response, next: NextFunction): void {
  if (!req.user?.organizationId) {
    next(new UnauthorizedError('Organization context required'));
    return;
  }
  next();
}

// Check that a resource belongs to the user's organization
export function verifyOrganizationOwnership(
  getOrganizationId: (req: Request) => Promise<string | null>
) {
  return async (req: any, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organizationId) {
        next(new ForbiddenError('Organization context required'));
        return;
      }

      const resourceOrgId = await getOrganizationId(req);
      if (resourceOrgId && resourceOrgId !== req.user.organizationId) {
        next(new ForbiddenError('Access denied: resource belongs to another organization'));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================
// Content Security Middleware
// ============================================================

// Security headers
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// ============================================================
// Prompt Injection Prevention
// ============================================================

const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<\|system\|>/i,
  /###\s*(system|instruction|prompt)/i,
  /forget\s+(everything|all|previous)/i,
  /new\s+(instructions?|rules?|prompts?)\s*:/i,
  /override\s+(system|instructions?)/i,
  /DAN\s+mode/i,
  /jailbreak/i,
  /act\s+as\s+if\s+you/i,
  /pretend\s+(you|to)\s+are/i,
];

// Detect and block prompt injection in text content
export function detectPromptInjection(content: string): { safe: boolean; reason?: string } {
  if (!content || typeof content !== 'string') return { safe: true };

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      return {
        safe: false,
        reason: `Potential prompt injection detected: content contains pattern that may attempt to override system instructions`,
      };
    }
  }

  return { safe: true };
}

// Middleware to check for prompt injection in AI-related endpoints
export function preventPromptInjection(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body;

  // Check message content for injection
  if (body?.message) {
    const check = detectPromptInjection(body.message);
    if (!check.safe) {
      next(new ForbiddenError(check.reason));
      return;
    }
  }

  // Check content fields (for resume uploads, job descriptions, etc.)
  if (body?.content) {
    const check = detectPromptInjection(body.content);
    if (!check.safe) {
      next(new ForbiddenError(check.reason));
      return;
    }
  }

  next();
}

// ============================================================
// Rate Limiting for AI Endpoints
// ============================================================

import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI request limit exceeded',
    message: 'Please wait before making more AI requests',
  },
});

// Stricter rate limit for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload limit exceeded',
    message: 'Please wait before uploading more files',
  },
});
