import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  calculateSkillGap,
  generateDevelopmentPlan,
  getCandidateSkillGaps,
  getCandidateLearningPlans,
  getSkillGapSummary,
} from '../services/skillgap.service';
import { metrics } from '../services/metrics.service';

// Calculate skill gap for a candidate-job pair
export const calculateSkillGapHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { candidateId, jobId } = req.params;

    const report = await calculateSkillGap(candidateId, jobId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    metrics.recordServiceError('skillgap.calculate', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('skillgap.calculate', Date.now() - start);
    metrics.incrementCounter('skillgap.calculations');
  }
};

// Generate development plan
export const generatePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { candidateId, jobId } = req.params;
    const { duration } = req.body;

    if (!['30-day', '60-day', '90-day'].includes(duration)) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be 30-day, 60-day, or 90-day',
      });
    }

    const plan = await generateDevelopmentPlan(
      candidateId,
      jobId,
      duration as '30-day' | '60-day' | '90-day'
    );

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    metrics.recordServiceError('skillgap.generatePlan', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('skillgap.generatePlan', Date.now() - start);
    metrics.incrementCounter('skillgap.plansGenerated');
  }
};

// Get skill gaps for a candidate
export const getCandidateGaps = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { candidateId } = req.params;

    const gaps = await getCandidateSkillGaps(candidateId);

    res.json({
      success: true,
      data: gaps,
    });
  } catch (error) {
    next(error);
  }
};

// Get learning plans for a candidate
export const getCandidatePlans = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { candidateId } = req.params;

    const plans = await getCandidateLearningPlans(candidateId);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

// Get skill gap summary for organization
export const getGapSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID required',
      });
    }

    const summary = await getSkillGapSummary(organizationId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
