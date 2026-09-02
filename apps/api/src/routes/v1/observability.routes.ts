import { Router, Request, Response, NextFunction } from 'express';
import { metrics } from '../../services/metrics.service';
import { getSystemHealth } from '../../services/health.service';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/v1/observability/dashboard — dashboard data for frontend
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await getSystemHealth();
    const metricsSnap = metrics.getSnapshot();

    // Aggregate recent audit log activity
    const recentAuditCount = await prisma.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    res.json({
      health: {
        status: health.status,
        uptime: health.uptime,
        checks: health.checks,
      },
      performance: {
        totalRequests: metricsSnap.requests.total,
        errorRate: metricsSnap.requests.errorRate,
        avgLatencyMs: metricsSnap.requests.avgLatencyMs,
        requestsByRoute: metricsSnap.requests.byRoute,
      },
      services: metricsSnap.services,
      memory: metricsSnap.memory,
      counters: metricsSnap.counters,
      gauges: metricsSnap.gauges,
      recentErrors: metricsSnap.recentErrors,
      auditActivity: { last24h: recentAuditCount },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/observability/service-health — service-level breakdown
router.get('/service-health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = metrics.getSnapshot();
    const services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      avgLatencyMs: number;
      errorRate: string;
      totalCalls: number;
    }> = [];

    for (const [name, data] of Object.entries(snap.services as Record<string, any>)) {
      const errorRate = data.count > 0 ? (data.errors / data.count) * 100 : 0;
      services.push({
        name,
        status: errorRate > 10 ? 'unhealthy' : errorRate > 5 ? 'degraded' : 'healthy',
        avgLatencyMs: data.avgMs,
        errorRate: `${errorRate.toFixed(1)}%`,
        totalCalls: data.count,
      });
    }

    res.json({ services });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/observability/logs — structured recent logs
router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const level = req.query.level as string;

    // Query recent audit logs
    const where: any = {};
    if (level) where.action = { contains: level };

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        metadata: true,
        ipAddress: true,
      },
    });

    res.json({ logs, total: logs.length });
  } catch (err) {
    next(err);
  }
});

export default router;
