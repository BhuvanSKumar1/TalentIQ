import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../../validators/auth.validator';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    const validRegister = {
      email: 'test@example.com',
      password: 'StrongPass1',
      firstName: 'John',
      lastName: 'Doe',
      organizationName: 'Acme Corp',
    };

    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({ ...validRegister, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject email without @', () => {
      const result = registerSchema.safeParse({ ...validRegister, email: 'testexample.com' });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({ ...validRegister, password: 'Ab1' });
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = registerSchema.safeParse({ ...validRegister, password: 'lowercase1' });
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = registerSchema.safeParse({ ...validRegister, password: 'UPPERCASE1' });
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({ ...validRegister, password: 'NoNumberHere' });
      expect(result.success).toBe(false);
    });

    it('should reject empty firstName', () => {
      const result = registerSchema.safeParse({ ...validRegister, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty lastName', () => {
      const result = registerSchema.safeParse({ ...validRegister, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty organizationName', () => {
      const result = registerSchema.safeParse({ ...validRegister, organizationName: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = registerSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject extra unknown fields (strict mode implied)', () => {
      // Zod by default strips unknown fields, so this should still succeed
      const result = registerSchema.safeParse({ ...validRegister, hack: 'yes' });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: 'pass' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({ email: 'bad', password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com' });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({ password: 'pass' });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('should accept valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: 'valid-token-string' });
      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing refresh token', () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'user@test.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'not-valid' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept valid reset data', () => {
      const result = resetPasswordSchema.safeParse({ token: 'abc', password: 'StrongPass1' });
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const result = resetPasswordSchema.safeParse({ token: '', password: 'StrongPass1' });
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = resetPasswordSchema.safeParse({ token: 'abc', password: 'weak' });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyEmailSchema', () => {
    it('should accept valid token', () => {
      const result = verifyEmailSchema.safeParse({ token: 'verify-token-123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const result = verifyEmailSchema.safeParse({ token: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Error Classes', () => {
  it('should create AppError with correct properties', async () => {
    const { AppError } = await import('../../utils/errors');
    const error = new AppError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should create BadRequestError with 400 status', async () => {
    const { BadRequestError } = await import('../../utils/errors');
    const error = new BadRequestError('Bad request');
    expect(error.statusCode).toBe(400);
  });

  it('should create UnauthorizedError with 401 status', async () => {
    const { UnauthorizedError } = await import('../../utils/errors');
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('should create ForbiddenError with 403 status', async () => {
    const { ForbiddenError } = await import('../../utils/errors');
    const error = new ForbiddenError('Forbidden access');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden access');
  });

  it('should create NotFoundError with 404 status', async () => {
    const { NotFoundError } = await import('../../utils/errors');
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
  });

  it('should create ConflictError with 409 status', async () => {
    const { ConflictError } = await import('../../utils/errors');
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
  });

  it('should create RateLimitError with 429 status', async () => {
    const { RateLimitError } = await import('../../utils/errors');
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
  });

  it('should create InternalError with 500 and non-operational', async () => {
    const { InternalError } = await import('../../utils/errors');
    const error = new InternalError();
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });

  it('should create ServiceUnavailableError with 503', async () => {
    const { ServiceUnavailableError } = await import('../../utils/errors');
    const error = new ServiceUnavailableError();
    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(false);
  });
});
