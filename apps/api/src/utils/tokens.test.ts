import { describe, it, expect } from 'vitest';
import { generateSecureToken, generateTokenHash, getPasswordResetExpiry, getEmailVerificationExpiry } from './tokens';

describe('Token utilities', () => {
  it('should generate a secure token', () => {
    const token = generateSecureToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64); // 32 bytes = 64 hex chars
  });

  it('should generate unique tokens', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();
    expect(token1).not.toBe(token2);
  });

  it('should hash a token', () => {
    const token = 'test-token-123';
    const hash = generateTokenHash(token);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
  });

  it('should produce consistent hashes', () => {
    const token = 'test-token-123';
    const hash1 = generateTokenHash(token);
    const hash2 = generateTokenHash(token);
    expect(hash1).toBe(hash2);
  });

  it('should generate valid expiry dates', () => {
    const now = Date.now();
    const resetExpiry = getPasswordResetExpiry();
    const verifyExpiry = getEmailVerificationExpiry();

    // Reset: 1 hour
    expect(resetExpiry.getTime() - now).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    expect(resetExpiry.getTime() - now).toBeGreaterThan(55 * 60 * 1000);

    // Verify: 24 hours
    expect(verifyExpiry.getTime() - now).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    expect(verifyExpiry.getTime() - now).toBeGreaterThan(23 * 60 * 60 * 1000);
  });
});
