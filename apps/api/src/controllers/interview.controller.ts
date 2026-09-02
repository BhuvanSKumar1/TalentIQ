import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterviewStatus,
  submitFeedback,
  generateInterviewQuestions,
  getInterviewSummary,
} from '../services/interview.service';
import { metrics } from '../services/metrics.service';

// Schedule interview
export const scheduleInterview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { candidateId, jobId, type, scheduledAt, duration, location, notes, interviewerId } = req.body;

    const interview = await createInterview({
      candidateId,
      jobId,
      type,
      scheduledAt,
      duration,
      location,
      notes,
      interviewerId,
    }, req.user!.userId);

    res.json({ success: true, data: interview });
  } catch (error) {
    metrics.recordServiceError('interview.schedule', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('interview.schedule', Date.now() - start);
    metrics.incrementCounter('interviews.scheduled');
  }
};

// Get all interviews
export const listInterviews = async (
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

    const { jobId, candidateId, status, upcoming } = req.query;
    const interviews = await getInterviews(organizationId, {
      jobId: jobId as string,
      candidateId: candidateId as string,
      status: status as string,
      upcoming: upcoming === 'true',
    });

    res.json({ success: true, data: interviews });
  } catch (error) {
    metrics.recordServiceError('interview.list', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('interview.list', Date.now() - start);
  }
};

// Get interview by ID
export const getInterview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { id } = req.params;
    const interview = await getInterviewById(id);

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

// Update interview status
export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const interview = await updateInterviewStatus(id, status, req.user!.userId);
    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

// Submit feedback
export const submitInterviewFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId, rating, strengths, weaknesses, notes, recommendation } = req.body;

    const feedback = await submitFeedback({
      interviewId,
      rating,
      strengths,
      weaknesses,
      notes,
      recommendation,
    }, req.user!.userId);

    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// Generate interview questions
export const generateQuestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { interviewId } = req.params;
    const { categories } = req.body;

    const questions = await generateInterviewQuestions(interviewId, categories);
    res.json({ success: true, data: questions });
  } catch (error) {
    metrics.recordServiceError('interview.generateQuestions', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('interview.generateQuestions', Date.now() - start);
    metrics.incrementCounter('interviews.questionsGenerated');
  }
};

// Get interview summary
export const getSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  try {
    const { interviewId } = req.params;
    const summary = await getInterviewSummary(interviewId);
    res.json({ success: true, data: summary });
  } catch (error) {
    metrics.recordServiceError('interview.summary', String(error));
    next(error);
  } finally {
    metrics.recordServiceLatency('interview.summary', Date.now() - start);
  }
};
