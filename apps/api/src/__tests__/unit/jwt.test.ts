import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock the config to use test secrets
vi.mock('../../config', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-for-unit-tests',
    JWT_REFRESH_SECRET: 'test-refresh-secret-for-unit-tests',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../utils/jwt';

const testPayload: TokenPayload = {
  userId: 'test-user-id-123',
  email: 'test@example.com',
  role: 'RECRUITER',
  organizationId: 'test-org-id-456',
};

describe('JWT Utilities', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should encode the payload in the token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.organizationId).toBe(testPayload.organizationId);
    });

    it('should generate unique tokens for different payloads', () => {
      const token1 = generateAccessToken({ ...testPayload, userId: 'user-1' });
      const token2 = generateAccessToken({ ...testPayload, userId: 'user-2' });
      expect(token1).not.toBe(token2);
    });

    it('should include expiration', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include unique jti claim', () => {
      const token1 = generateRefreshToken(testPayload);
      const token2 = generateRefreshToken(testPayload);
      const decoded1 = jwt.decode(token1) as any;
      const decoded2 = jwt.decode(token2) as any;
      // Refresh tokens should have unique jti even with same payload
      expect(decoded1.jti).toBeDefined();
      expect(decoded2.jti).toBeDefined();
      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it('should encode all payload fields', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw on token signed with wrong secret', () => {
      const token = jwt.sign(testPayload, 'wrong-secret');
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should throw on expired token', () => {
      const token = jwt.sign(testPayload, 'test-secret-key-for-unit-tests', { expiresIn: '0s' });
      // Wait a moment for token to expire
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should throw on empty string', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should throw on access token used as refresh token', () => {
      const accessToken = generateAccessToken(testPayload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });

    it('should throw on tampered token', () => {
      const token = generateRefreshToken(testPayload);
      const parts = token.split('.');
      parts[1] = Buffer.from(JSON.stringify({ tampered: true })).toString('base64');
      expect(() => verifyRefreshToken(parts.join('.'))).toThrow();
    });

    it('should preserve jti in verified token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token) as any;
      expect(decoded.jti).toBeDefined();
      expect(typeof decoded.jti).toBe('string');
    });
  });
});
