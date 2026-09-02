import { describe, it, expect } from 'vitest';
import { hasPermission, PERMISSIONS, ROLES } from './rbac';

describe('RBAC utilities', () => {
  describe('hasPermission', () => {
    it('should allow ORG_ADMIN to create jobs', () => {
      expect(hasPermission('ORG_ADMIN', 'jobs', 'create')).toBe(true);
    });

    it('should allow RECRUITER to read candidates', () => {
      expect(hasPermission('RECRUITER', 'candidates', 'read')).toBe(true);
    });

    it('should not allow INTERVIEWER to delete jobs', () => {
      expect(hasPermission('INTERVIEWER', 'jobs', 'delete')).toBe(false);
    });

    it('should allow SUPER_ADMIN to do everything', () => {
      expect(hasPermission('SUPER_ADMIN', 'jobs', 'create')).toBe(true);
      expect(hasPermission('SUPER_ADMIN', 'jobs', 'delete')).toBe(true);
      expect(hasPermission('SUPER_ADMIN', 'users', 'delete')).toBe(true);
      expect(hasPermission('SUPER_ADMIN', 'audit', 'read')).toBe(true);
    });

    it('should not allow unknown role', () => {
      expect(hasPermission('UNKNOWN_ROLE', 'jobs', 'create')).toBe(false);
    });

    it('should return false for unknown resource', () => {
      expect(hasPermission('ORG_ADMIN', 'unknown_resource', 'create')).toBe(false);
    });

    it('should return false for unknown action', () => {
      expect(hasPermission('ORG_ADMIN', 'jobs', 'unknown_action')).toBe(false);
    });

    it('should allow HIRING_MANAGER to read analytics', () => {
      expect(hasPermission('HIRING_MANAGER', 'analytics', 'read')).toBe(true);
    });

    it('should not allow HIRING_MANAGER to manage users', () => {
      expect(hasPermission('HIRING_MANAGER', 'users', 'create')).toBe(false);
    });

    it('should allow ORG_ADMIN to read audit logs', () => {
      expect(hasPermission('ORG_ADMIN', 'audit', 'read')).toBe(true);
    });

    it('should not allow RECRUITER to read audit logs', () => {
      expect(hasPermission('RECRUITER', 'audit', 'read')).toBe(false);
    });
  });
});
