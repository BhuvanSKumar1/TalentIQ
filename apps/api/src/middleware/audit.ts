import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

export interface AuditOptions {
  action: string;
  entityType: string;
  getEntityId?: (req: AuthRequest) => string | undefined;
  getMetadata?: (req: AuthRequest) => Record<string, unknown>;
}

export function auditLog(options: AuditOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      // Log audit entry after response
      const entityId = options.getEntityId?.(req) ?? (req.params as Record<string, string>).id;

      prisma.auditLog
        .create({
          data: {
            actorId: req.user?.userId || 'system',
            action: options.action,
            entityType: options.entityType,
            entityId,
            metadata: (options.getMetadata?.(req) ?? {}) as any,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            organizationId: req.user?.organizationId || '',
          },
        })
        .catch((err) => {
          logger.error({ err }, 'Failed to create audit log');
        });

      return originalJson(body);
    } as typeof res.json;

    next();
  };
}
