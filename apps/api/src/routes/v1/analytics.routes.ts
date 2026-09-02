import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboard, exportData } from '../../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

// Get analytics dashboard
router.get('/dashboard', getDashboard);

// Export analytics data
router.get('/export', exportData);

export default router;
