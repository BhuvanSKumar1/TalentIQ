import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  calculateSkillGapHandler,
  generatePlan,
  getCandidateGaps,
  getCandidatePlans,
  getGapSummary,
} from '../../controllers/skillgap.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Calculate skill gap for a candidate-job pair
router.get('/candidate/:candidateId/job/:jobId', calculateSkillGapHandler);

// Generate development plan
router.post('/candidate/:candidateId/job/:jobId/plan', generatePlan);

// Get skill gaps for a candidate
router.get('/candidate/:candidateId', getCandidateGaps);

// Get learning plans for a candidate
router.get('/candidate/:candidateId/plans', getCandidatePlans);

// Get skill gap summary for organization
router.get('/summary', getGapSummary);

export default router;
