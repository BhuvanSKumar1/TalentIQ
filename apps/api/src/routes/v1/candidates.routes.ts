import { Router } from 'express';
import { CandidatesController } from '../../controllers/candidates.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', CandidatesController.list);
router.get('/stats', CandidatesController.getStats);
router.get('/:id', CandidatesController.getById);
router.post('/', CandidatesController.create);
router.put('/:id', CandidatesController.update);
router.delete('/:id', CandidatesController.delete);

export default router;
