import { describe, it, expect } from 'vitest';
import { hasPermission, ROLES, PERMISSIONS } from '../../utils/rbac';

describe('RBAC Permissions', () => {
  describe('hasPermission', () => {
    // ── Jobs ──────────────────────────────────────────────
    describe('Jobs', () => {
      it('SUPER_ADMIN can create jobs', () => {
        expect(hasPermission('SUPER_ADMIN', 'jobs', 'create')).toBe(true);
      });

      it('ORG_ADMIN can create jobs', () => {
        expect(hasPermission('ORG_ADMIN', 'jobs', 'create')).toBe(true);
      });

      it('RECRUITER can create jobs', () => {
        expect(hasPermission('RECRUITER', 'jobs', 'create')).toBe(true);
      });

      it('HIRING_MANAGER cannot create jobs', () => {
        expect(hasPermission('HIRING_MANAGER', 'jobs', 'create')).toBe(false);
      });

      it('INTERVIEWER cannot create jobs', () => {
        expect(hasPermission('INTERVIEWER', 'jobs', 'create')).toBe(false);
      });

      it('RECRUITER can read jobs', () => {
        expect(hasPermission('RECRUITER', 'jobs', 'read')).toBe(true);
      });

      it('HIRING_MANAGER can read jobs', () => {
        expect(hasPermission('HIRING_MANAGER', 'jobs', 'read')).toBe(true);
      });

      it('INTERVIEWER cannot read jobs', () => {
        expect(hasPermission('INTERVIEWER', 'jobs', 'read')).toBe(false);
      });

      it('RECRUITER can update jobs', () => {
        expect(hasPermission('RECRUITER', 'jobs', 'update')).toBe(true);
      });

      it('HIRING_MANAGER cannot update jobs', () => {
        expect(hasPermission('HIRING_MANAGER', 'jobs', 'update')).toBe(false);
      });

      it('SUPER_ADMIN can delete jobs', () => {
        expect(hasPermission('SUPER_ADMIN', 'jobs', 'delete')).toBe(true);
      });

      it('RECRUITER cannot delete jobs', () => {
        expect(hasPermission('RECRUITER', 'jobs', 'delete')).toBe(false);
      });
    });

    // ── Candidates ────────────────────────────────────────
    describe('Candidates', () => {
      it('RECRUITER can create candidates', () => {
        expect(hasPermission('RECRUITER', 'candidates', 'create')).toBe(true);
      });

      it('INTERVIEWER can read candidates', () => {
        expect(hasPermission('INTERVIEWER', 'candidates', 'read')).toBe(true);
      });

      it('INTERVIEWER cannot create candidates', () => {
        expect(hasPermission('INTERVIEWER', 'candidates', 'create')).toBe(false);
      });

      it('HIRING_MANAGER can read candidates', () => {
        expect(hasPermission('HIRING_MANAGER', 'candidates', 'read')).toBe(true);
      });

      it('RECRUITER can update candidates', () => {
        expect(hasPermission('RECRUITER', 'candidates', 'update')).toBe(true);
      });

      it('HIRING_MANAGER cannot update candidates', () => {
        expect(hasPermission('HIRING_MANAGER', 'candidates', 'update')).toBe(false);
      });
    });

    // ── Users ─────────────────────────────────────────────
    describe('Users', () => {
      it('SUPER_ADMIN can manage users', () => {
        expect(hasPermission('SUPER_ADMIN', 'users', 'create')).toBe(true);
        expect(hasPermission('SUPER_ADMIN', 'users', 'read')).toBe(true);
        expect(hasPermission('SUPER_ADMIN', 'users', 'update')).toBe(true);
        expect(hasPermission('SUPER_ADMIN', 'users', 'delete')).toBe(true);
      });

      it('ORG_ADMIN can manage users', () => {
        expect(hasPermission('ORG_ADMIN', 'users', 'create')).toBe(true);
        expect(hasPermission('ORG_ADMIN', 'users', 'update')).toBe(true);
        expect(hasPermission('ORG_ADMIN', 'users', 'delete')).toBe(true);
      });

      it('RECRUITER cannot manage users', () => {
        expect(hasPermission('RECRUITER', 'users', 'create')).toBe(false);
        expect(hasPermission('RECRUITER', 'users', 'update')).toBe(false);
        expect(hasPermission('RECRUITER', 'users', 'delete')).toBe(false);
      });

      it('RECRUITER can read users', () => {
        expect(hasPermission('RECRUITER', 'users', 'read')).toBe(true);
      });
    });

    // ── Audit ─────────────────────────────────────────────
    describe('Audit', () => {
      it('SUPER_ADMIN can read audit logs', () => {
        expect(hasPermission('SUPER_ADMIN', 'audit', 'read')).toBe(true);
      });

      it('ORG_ADMIN can read audit logs', () => {
        expect(hasPermission('ORG_ADMIN', 'audit', 'read')).toBe(true);
      });

      it('RECRUITER cannot read audit logs', () => {
        expect(hasPermission('RECRUITER', 'audit', 'read')).toBe(false);
      });
    });

    // ── Analytics ─────────────────────────────────────────
    describe('Analytics', () => {
      it('RECRUITER can read analytics', () => {
        expect(hasPermission('RECRUITER', 'analytics', 'read')).toBe(true);
      });

      it('HIRING_MANAGER can read analytics', () => {
        expect(hasPermission('HIRING_MANAGER', 'analytics', 'read')).toBe(true);
      });

      it('INTERVIEWER cannot read analytics', () => {
        expect(hasPermission('INTERVIEWER', 'analytics', 'read')).toBe(false);
      });
    });

    // ── Edge cases ────────────────────────────────────────
    describe('Edge Cases', () => {
      it('should return false for unknown resource', () => {
        expect(hasPermission('SUPER_ADMIN', 'unknown_resource', 'read')).toBe(false);
      });

      it('should return false for unknown action', () => {
        expect(hasPermission('SUPER_ADMIN', 'jobs', 'unknown_action')).toBe(false);
      });

      it('should return false for unknown role', () => {
        expect(hasPermission('UNKNOWN_ROLE', 'jobs', 'create')).toBe(false);
      });

      it('should return false for empty role', () => {
        expect(hasPermission('', 'jobs', 'create')).toBe(false);
      });

      it('should return false for empty resource', () => {
        expect(hasPermission('SUPER_ADMIN', '', 'create')).toBe(false);
      });

      it('should return false for empty action', () => {
        expect(hasPermission('SUPER_ADMIN', 'jobs', '')).toBe(false);
      });
    });
  });

  describe('ROLES constant', () => {
    it('should define all 5 roles', () => {
      expect(Object.keys(ROLES)).toHaveLength(5);
    });

    it('should include SUPER_ADMIN', () => {
      expect(ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
    });

    it('should include INTERVIEWER', () => {
      expect(ROLES.INTERVIEWER).toBe('INTERVIEWER');
    });
  });

  describe('PERMISSIONS structure', () => {
    it('should have permissions for all resources', () => {
      expect(PERMISSIONS.jobs).toBeDefined();
      expect(PERMISSIONS.candidates).toBeDefined();
      expect(PERMISSIONS.users).toBeDefined();
      expect(PERMISSIONS.audit).toBeDefined();
      expect(PERMISSIONS.analytics).toBeDefined();
    });

    it('each resource should have CRUD-like actions', () => {
      expect(PERMISSIONS.jobs.create).toBeDefined();
      expect(PERMISSIONS.jobs.read).toBeDefined();
      expect(PERMISSIONS.jobs.update).toBeDefined();
      expect(PERMISSIONS.jobs.delete).toBeDefined();
    });
  });
});
