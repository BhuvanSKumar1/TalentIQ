import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAccessToken } from '../../utils/jwt';

// Mock config before importing auth middleware
vi.mock('../../config', () => ({
  config: {
    JWT_SECRET: 'test-secret-for-middleware',
    JWT_REFRESH_SECRET: 'test-refresh-secret-for-middleware',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

import { authenticate, authorize, requirePermission } from '../../middleware/auth';

function mockReq(authHeader?: string) {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  } as any;
}

function mockRes() {
  return {} as any;
}

function mockNext() {
  return vi.fn();
}

const adminPayload = {
  userId: 'admin-1',
  email: 'admin@test.com',
  role: 'SUPER_ADMIN',
  organizationId: 'org-1',
};

const recruiterPayload = {
  userId: 'recruiter-1',
  email: 'recruiter@test.com',
  role: 'RECRUITER',
  organizationId: 'org-1',
};

const interviewerPayload = {
  userId: 'interviewer-1',
  email: 'interviewer@test.com',
  role: 'INTERVIEWER',
  organizationId: 'org-1',
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should set user on valid token', () => {
      const token = generateAccessToken(adminPayload);
      const req = mockReq(`Bearer ${token}`);
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('admin-1');
      expect(req.user?.role).toBe('SUPER_ADMIN');
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject request without Authorization header', () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should reject request with non-Bearer token', () => {
      const req = mockReq('Basic abc123');
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should reject request with invalid token', () => {
      const req = mockReq('Bearer invalid-token-here');
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should reject request with expired token', () => {
      // Create a token that's already expired
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(adminPayload, 'test-secret-for-middleware', { expiresIn: '0s' });
      const req = mockReq(`Bearer ${token}`);
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should reject token with wrong secret', () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(adminPayload, 'wrong-secret');
      const req = mockReq(`Bearer ${token}`);
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should accept empty Bearer prefix', () => {
      const req = mockReq('Bearer ');
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });
  });

  describe('authorize', () => {
    it('should allow authorized role', () => {
      const req = mockReq();
      req.user = adminPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize('SUPER_ADMIN', 'ORG_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject unauthorized role', () => {
      const req = mockReq();
      req.user = interviewerPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize('SUPER_ADMIN', 'ORG_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
      }));
    });

    it('should reject when no user on request', () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize('SUPER_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should allow any role when no specific roles required', () => {
      const req = mockReq();
      req.user = recruiterPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize();
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow RECRUITER when listed', () => {
      const req = mockReq();
      req.user = recruiterPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize('SUPER_ADMIN', 'RECRUITER');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requirePermission', () => {
    it('should allow when role has permission', () => {
      const req = mockReq();
      req.user = adminPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = requirePermission('jobs', 'create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny when role lacks permission', () => {
      const req = mockReq();
      req.user = interviewerPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = requirePermission('jobs', 'create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
      }));
    });

    it('should deny when no user on request', () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      const middleware = requirePermission('jobs', 'read');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('should deny for unknown resource', () => {
      const req = mockReq();
      req.user = adminPayload;
      const res = mockRes();
      const next = mockNext();

      const middleware = requirePermission('nonexistent', 'create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
      }));
    });
  });
});
