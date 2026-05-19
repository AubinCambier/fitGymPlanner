import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { checkActive } from '../middlewares/checkActive.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { bookingCreateSchema } from '../validators/bookingValidator.js';

const router = Router();

router.get('/', authenticate, checkActive, authorize('MEMBER'), bookingController.getMyBookings);
router.post('/', authenticate, checkActive, authorize('MEMBER'), validateBody(bookingCreateSchema), bookingController.create);
router.patch('/:id/cancel', authenticate, checkActive, authorize('MEMBER'), bookingController.cancel);

export default router;
