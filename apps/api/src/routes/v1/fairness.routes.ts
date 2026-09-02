import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getDashboard,
  getExplainability,
  runTests,
} from '../../controllers/fairness.controller';

const router = Router();

router.use(authenticate);

// Fairness dashboard
router.get('/dashboard', getDashboard);

// Explainability report for a specific candidate-job match
router.get('/explain/:candidateId/:jobId', getExplainability);

// Protected feature leakage tests
router.post('/tests', runTests);

export default router;
