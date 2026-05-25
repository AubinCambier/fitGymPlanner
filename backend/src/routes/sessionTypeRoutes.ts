import { Router } from 'express';
import { sessionTypeController } from '../controllers/sessionTypeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { sessionTypeSchema } from '../validators/sessionTypeValidator.js';

const router = Router();

router.get('/', sessionTypeController.getAll);
router.post('/', authenticate, authorize('ADMIN'), validateBody(sessionTypeSchema), sessionTypeController.create);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(sessionTypeSchema), sessionTypeController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), sessionTypeController.remove);

export default router;
