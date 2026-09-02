import { Router, Request, Response } from 'express';
import authRoutes from './v1/auth.routes';
import jobsRoutes from './v1/jobs.routes';
import candidatesRoutes from './v1/candidates.routes';
import resumeRoutes from './v1/resume.routes';
import skillsRoutes from './v1/skills.routes';
import matchingRoutes from './v1/matching.routes';
import searchRoutes from './v1/search.routes';
import aiRoutes from './v1/ai.routes';
import skillgapRoutes from './v1/skillgap.routes';
import fairnessRoutes from './v1/fairness.routes';
import interviewRoutes from './v1/interview.routes';
import analyticsRoutes from './v1/analytics.routes';
import observabilityRoutes from './v1/observability.routes';
import { rateLimiter } from '../middleware/rateLimiter';
import { sanitizeInput, securityHeaders } from '../middleware/security';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// Security headers (applied to all routes)
router.use(securityHeaders);

// Input sanitization (applied to all routes)
router.use(sanitizeInput);

// ── Health & Observability (no auth required) ──
router.get('/health', HealthController._basic);
router.get('/health/detailed', HealthController.detailed as any);
router.get('/health/readiness', HealthController.readiness as any);
router.get('/health/liveness', HealthController.liveness);
router.get('/metrics', HealthController.metrics as any);

// API v1 routes
router.use('/v1', rateLimiter);
router.use('/v1/auth', authRoutes);
router.use('/v1/jobs', jobsRoutes);
router.use('/v1/candidates', candidatesRoutes);
router.use('/v1/resumes', resumeRoutes);
router.use('/v1/skills', skillsRoutes);
router.use('/v1/matching', matchingRoutes);
router.use('/v1/search', searchRoutes);
router.use('/v1/ai', aiRoutes);
router.use('/v1/skill-gap', skillgapRoutes);
router.use('/v1/fairness', fairnessRoutes);
router.use('/v1/interviews', interviewRoutes);
router.use('/v1/analytics', analyticsRoutes);
router.use('/v1/observability', observabilityRoutes);

export default router;
