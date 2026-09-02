import { Router } from 'express';
import { JobsController } from '../../controllers/jobs.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createJobSchema, updateJobSchema } from '../../validators/jobs.validator';

const router = Router();

router.use(authenticate);

router.get('/', JobsController.list);
router.get('/stats', JobsController.getStats);
router.get('/:id', JobsController.getById);
router.post('/', validate(createJobSchema), JobsController.create);
router.put('/:id', validate(updateJobSchema), JobsController.update);
router.delete('/:id', JobsController.delete);
router.post('/:id/publish', JobsController.publish);
router.post('/:id/archive', JobsController.archive);
router.post('/:id/duplicate', JobsController.duplicate);
router.post('/analyze', JobsController.analyze);

export default router;
