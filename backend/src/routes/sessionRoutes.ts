import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { checkActive } from '../middlewares/checkActive.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { sessionCreateSchema, sessionUpdateSchema } from '../validators/sessionValidator.js';

const router = Router();

router.get('/', sessionController.getAll);
router.get('/:id', sessionController.getById);
router.post('/', authenticate, checkActive, authorize('ADMIN', 'COACH'), validateBody(sessionCreateSchema), sessionController.create);
router.put('/:id', authenticate, checkActive, authorize('ADMIN', 'COACH'), validateBody(sessionUpdateSchema), sessionController.update);
router.delete('/:id', authenticate, checkActive, authorize('ADMIN'), sessionController.remove);
router.get('/:id/participants', authenticate, checkActive, authorize('ADMIN', 'COACH'), sessionController.getParticipants);

export default router;
