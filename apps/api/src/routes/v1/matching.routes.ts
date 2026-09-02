import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  calculateMatchController,
  matchAllForJobController,
  getRankedCandidatesController,
  getMatchDetailController,
  getMatchStatsController,
} from '../../controllers/matching.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Calculate match for a specific candidate-job pair
router.post('/calculate/:candidateId/:jobId', calculateMatchController);

// Run matching for all candidates against a job
router.post('/job/:jobId/run', matchAllForJobController);

// Get ranked candidates for a job
router.get('/rankings', getRankedCandidatesController);

// Get match detail for a specific candidate-job pair
router.get('/detail/:candidateId/:jobId', getMatchDetailController);

// Get match stats for a job
router.get('/stats/:jobId', getMatchStatsController);

export default router;
