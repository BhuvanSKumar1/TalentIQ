import { prisma } from '../config/database';
import { logger } from './logger';

export interface AuditEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: (entry.metadata || {}) as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        organizationId: entry.organizationId,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create audit log');
  }
}

// Convenience functions for auth events
export const AuthAudit = {
  async userRegistered(userId: string, organizationId: string, meta: { email: string; ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.registered',
      entityType: 'User',
      entityId: userId,
      metadata: { email: meta.email },
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async userLoggedIn(userId: string, organizationId: string, meta: { ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.login',
      entityType: 'User',
      entityId: userId,
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async userLoggedOut(userId: string, organizationId: string, meta: { ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.logout',
      entityType: 'User',
      entityId: userId,
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async passwordResetRequested(userId: string, organizationId: string, meta: { email: string; ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.password_reset_requested',
      entityType: 'User',
      entityId: userId,
      metadata: { email: meta.email },
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async passwordReset(userId: string, organizationId: string, meta: { ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.password_reset',
      entityType: 'User',
      entityId: userId,
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async emailVerificationSent(userId: string, organizationId: string, meta: { email: string; ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.email_verification_sent',
      entityType: 'User',
      entityId: userId,
      metadata: { email: meta.email },
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async emailVerified(userId: string, organizationId: string, meta: { ip?: string; ua?: string }) {
    await createAuditLog({
      actorId: userId,
      action: 'user.email_verified',
      entityType: 'User',
      entityId: userId,
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId,
    });
  },

  async loginFailed(meta: { email: string; ip?: string; ua?: string; reason: string }) {
    // Use system actor for failed logins (user doesn't exist yet)
    await createAuditLog({
      actorId: '00000000-0000-0000-0000-000000000000',
      action: 'user.login_failed',
      entityType: 'User',
      metadata: { email: meta.email, reason: meta.reason },
      ipAddress: meta.ip,
      userAgent: meta.ua,
      organizationId: '00000000-0000-0000-0000-000000000000',
    });
  },
};
