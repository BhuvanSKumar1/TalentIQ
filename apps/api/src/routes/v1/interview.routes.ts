import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  scheduleInterview,
  listInterviews,
  getInterview,
  updateStatus,
  submitInterviewFeedback,
  generateQuestions,
  getSummary,
} from '../../controllers/interview.controller';

const router = Router();

router.use(authenticate);

// List all interviews
router.get('/', listInterviews);

// Get interview by ID
router.get('/:id', getInterview);

// Schedule interview
router.post('/', scheduleInterview);

// Update interview status
router.patch('/:id/status', updateStatus);

// Submit feedback
router.post('/feedback', submitInterviewFeedback);

// Generate interview questions
router.post('/:interviewId/questions', generateQuestions);

// Get interview summary
router.get('/:interviewId/summary', getSummary);

export default router;
