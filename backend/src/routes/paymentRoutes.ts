import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { checkActive } from '../middlewares/checkActive.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { paymentCreateSchema } from '../validators/paymentValidator.js';

const router = Router();

router.post(
  '/',
  authenticate,
  checkActive,
  authorize('MEMBER'),
  validateBody(paymentCreateSchema),
  paymentController.create
);

router.get(
  '/me',
  authenticate,
  checkActive,
  authorize('MEMBER'),
  paymentController.getMyPayments
);

export default router;
