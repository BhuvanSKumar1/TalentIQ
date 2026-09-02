import { Request, Response, NextFunction } from 'express';
import { metrics } from '../services/metrics.service';
import { logger } from '../utils/logger';

/**
 * Timing middleware — records request latency, status, and feeds the metrics collector.
 * Must be registered AFTER the correlationId middleware so correlationId is available.
 */
export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Capture the original end method
  const originalEnd = res.end.bind(res);
  res.end = function (this: Response, ...args: any[]) {
    try {
      const durationMs = Date.now() - start;
      const route = normalizeRoute(req.route?.path || req.path);
      const method = req.method;
      const statusCode = res.statusCode;

      // Record in metrics
      metrics.recordRequest(method, route, statusCode, durationMs, req.correlationId);

      // Structured log for every request
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      // Do NOT log sensitive fields (passwords, tokens, PII)
      const safeQuery = sanitizeLogData(req.query);
      const safeBody = sanitizeLogData(req.body);

      (logger as any)[logLevel]({
        correlationId: req.correlationId,
        method,
        route,
        statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        query: Object.keys(safeQuery).length > 0 ? safeQuery : undefined,
        userId: (req as any).user?.id,
      }, `${method} ${route} ${statusCode} ${durationMs}ms`);
    } catch {
      // Don't let logging/metrics errors break the response
    }

    return originalEnd(...args);
  };

  next();
}

/**
 * Normalize route patterns to avoid cardinality explosion:
 * /api/v1/candidates/abc-123-def → /api/v1/candidates/:id
 */
function normalizeRoute(path: string): string {
  if (!path) return '/';
  // Replace UUID-like segments
  return path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ':id'
  );
}

/**
 * Remove sensitive fields from log data.
 * Passwords, tokens, secrets, and PII are stripped.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'refreshToken',
  'accessToken',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'creditCard',
  'ssn',
  'resume',    // raw resume content
  'content',   // raw resume content
]);

function sanitizeLogData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeLogData);

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
