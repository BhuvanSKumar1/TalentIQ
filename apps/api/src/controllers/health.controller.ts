import { Request, Response, NextFunction } from 'express';
import { getSystemHealth, generatePrometheusMetrics } from '../services/health.service';

export class HealthController {
  /** GET /api/health — lightweight health check (no DB query) */
  static _basic(_req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  /** GET /api/health/detailed — full system health with DB, Redis, memory, metrics */
  static async detailed(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await getSystemHealth();
      const statusCode = health.status === 'unhealthy' ? 503 : 200;
      res.status(statusCode).json(health);
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/metrics — Prometheus-compatible text metrics */
  static metrics(_req: Request, res: Response): void {
    const body = generatePrometheusMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(body);
  }

  /** GET /api/health/readiness — readiness probe (is the service ready to accept traffic?) */
  static async readiness(_req: Request, res: Response): Promise<void> {
    try {
      const { prisma } = await import('../config/database');
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not ready', reason: 'database unreachable' });
    }
  }

  /** GET /api/health/liveness — liveness probe (is the process alive?) */
  static liveness(_req: Request, res: Response): void {
    res.json({ status: 'alive', pid: process.pid });
  }
}
