import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password';

describe('Password utilities', () => {
  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.startsWith('$2b$')).toBe(true); // bcrypt hash
  });

  it('should verify a correct password', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);

    const isValid = await comparePassword(password, hashed);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);

    const isValid = await comparePassword('WrongPassword', hashed);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for the same password', async () => {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // bcrypt uses random salt, so hashes should differ
    expect(hash1).not.toBe(hash2);
    // But both should verify correctly
    expect(await comparePassword(password, hash1)).toBe(true);
    expect(await comparePassword(password, hash2)).toBe(true);
  });
});
