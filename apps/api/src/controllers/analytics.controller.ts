import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAnalyticsDashboard } from '../services/analytics.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get analytics dashboard
export const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID required' });
    }

    const { startDate, endDate, jobId, department } = req.query;

    const dashboard = await getAnalyticsDashboard(organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
      jobId: jobId as string,
      department: department as string,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        organizationId,
        action: 'ANALYTICS_VIEWED',
        entityType: 'Analytics',
        entityId: organizationId,
        metadata: { filters: { startDate, endDate, jobId, department } },
      },
    });

    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
};

// Export analytics data (placeholder for export architecture)
export const exportData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID required' });
    }

    const dashboard = await getAnalyticsDashboard(organizationId);

    // In production, this would generate CSV/PDF
    res.json({
      success: true,
      data: {
        format: 'json',
        generatedAt: new Date().toISOString(),
        metrics: dashboard.metrics,
        insights: dashboard.insights,
      },
      message: 'Export generated successfully. In production, this would download as CSV or PDF.',
    });
  } catch (error) {
    next(error);
  }
};
