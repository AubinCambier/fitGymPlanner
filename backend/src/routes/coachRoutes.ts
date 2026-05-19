import { Router } from 'express';
import { z } from 'zod';
import { coachController } from '../controllers/coachController.js';
import { coachRequestController } from '../controllers/coachRequestController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { checkActive } from '../middlewares/checkActive.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';

const coachRequestCreateSchema = z.object({
  session_id: z.number().int().positive(),
  reason: z.string().min(1),
});

const router = Router();

router.use(authenticate, checkActive, authorize('COACH'));

router.get('/sessions', coachController.getMySessions);
router.get('/sessions/:id/participants', coachController.getMySessionParticipants);
router.get('/requests', coachRequestController.getMyRequests);
router.post('/requests', validateBody(coachRequestCreateSchema), coachRequestController.create);

export default router;
