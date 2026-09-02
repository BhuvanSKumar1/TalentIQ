import { Router } from 'express';
import { SkillsController } from '../../controllers/skills.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/categories', SkillsController.categories);
router.get('/analytics', SkillsController.analytics);
router.get('/graph', SkillsController.graph);
router.get('/resolve', SkillsController.resolveAlias);
router.get('/', SkillsController.list);
router.get('/:id', SkillsController.getById);

export default router;
