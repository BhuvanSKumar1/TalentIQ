import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getFairnessDashboard,
  getExplainabilityReport,
  runProtectedFeatureTest,
} from '../services/fairness.service';
import { PrismaClient } from '@prisma/client';
import { metrics } from '../services/metrics.service';

const prisma = new PrismaClient();

// Get fairness dashboard
export const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID required' });
    }

    const dashboard = await getFairnessDashboard(organizationId);

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        action: 'FAIRNESS_DASHBOARD_VIEWED',
        entityType: 'FairnessAudit',
        entityId: organizationId,
        metadata: { timestamp: new Date().toISOString() },
      },
    });

    res.json({ success: true, data: dashboard });
  } catch (error) {
    metrics.recordServiceError('fairness.dashboard', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('fairness.dashboard', Date.now() - start);
  }
};

// Get explainability report for a candidate-job match
export const getExplainability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { candidateId, jobId } = req.params;

    const report = await getExplainabilityReport(candidateId, jobId);

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        action: 'EXPLAINABILITY_REPORT_VIEWED',
        entityType: 'CandidateMatch',
        entityId: candidateId,
        metadata: { jobId, rank: report.rank, score: report.overallScore },
      },
    });

    res.json({ success: true, data: report });
  } catch (error) {
    metrics.recordServiceError('fairness.explainability', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('fairness.explainability', Date.now() - start);
  }
};

// Run protected feature leakage tests
export const runTests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID required' });
    }

    const results = await runProtectedFeatureTest(organizationId);

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        action: 'PROTECTED_FEATURE_TEST_RUN',
        entityType: 'FairnessAudit',
        entityId: organizationId,
        metadata: {
          result: results.overallResult,
          passed: results.passed,
          total: results.total,
        },
      },
    });

    res.json({ success: true, data: results });
  } catch (error) {
    metrics.recordServiceError('fairness.tests', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('fairness.tests', Date.now() - start);
    metrics.incrementCounter('fairness.testsRun');
  }
};
