import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { bookingCreateSchema } from '../validators/bookingValidator.js';

const router = Router();

router.get('/', authenticate, authorize('MEMBER'), bookingController.getMyBookings);
router.post('/', authenticate, authorize('MEMBER'), validateBody(bookingCreateSchema), bookingController.create);
router.patch('/:id/cancel', authenticate, authorize('MEMBER'), bookingController.cancel);

export default router;
