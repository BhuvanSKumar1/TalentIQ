import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  calculateMatch,
  matchCandidatesForJob,
  getRankedCandidates,
  getMatchDetail,
  getMatchStats,
  MatchFilters,
} from '../services/matching.service';
import { metrics } from '../services/metrics.service';

// ============================================================
// Calculate match for a specific candidate-job pair
export const calculateMatchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { candidateId, jobId } = req.params;

    const start = Date.now();
    const result = await calculateMatch(candidateId, jobId);
    metrics.recordServiceLatency('matching.score', Date.now() - start);
    metrics.incrementCounter('matching.calculations');

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Run matching for all candidates against a job
export const matchAllForJobController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const start = Date.now();
    const results = await matchCandidatesForJob(jobId);
    metrics.recordServiceLatency('matching.batch', Date.now() - start);
    metrics.incrementCounter('matching.batch_runs');

    res.json({
      success: true,
      data: {
        jobId,
        totalMatched: results.length,
        rankings: results.map((r, index) => ({
          rank: index + 1,
          candidateId: r.candidateId,
          candidateName: r.candidateName,
          overallScore: r.overallScore,
          categoryScores: r.categoryScores,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Get ranked candidates for a job
export const getRankedCandidatesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      jobId,
      candidateId,
      minScore,
      maxScore,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const filters: MatchFilters = {
      jobId: jobId as string,
      candidateId: candidateId as string,
      minScore: minScore ? parseFloat(minScore as string) : undefined,
      maxScore: maxScore ? parseFloat(maxScore as string) : undefined,
      sortBy: sortBy as MatchFilters['sortBy'],
      sortOrder: sortOrder as MatchFilters['sortOrder'],
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    };

    const result = await getRankedCandidates(filters);

    res.json({
      success: true,
      data: result.matches,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Get match detail
export const getMatchDetailController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { candidateId, jobId } = req.params;

    const match = await getMatchDetail(candidateId, jobId);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found. Run matching first.',
      });
    }

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Get match stats for a job
export const getMatchStatsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const stats = await getMatchStats(jobId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
