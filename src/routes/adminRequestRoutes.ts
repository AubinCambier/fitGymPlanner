import { Router } from 'express';
import { coachRequestController } from '../controllers/coachRequestController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { z } from 'zod';

const decideSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  admin_comment: z.string().optional(),
});

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', coachRequestController.getAllAdmin);
router.patch('/:id', validateBody(decideSchema), coachRequestController.decide);

export default router;
