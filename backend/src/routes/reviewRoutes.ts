import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { checkActive } from '../middlewares/checkActive.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { reviewCreateSchema, reviewUpdateSchema } from '../validators/reviewValidator.js';

const router = Router();

router.get('/coach/:coachId', reviewController.getByCoach);

router.get(
  '/mine',
  authenticate,
  checkActive,
  authorize('MEMBER'),
  reviewController.getMine
);

router.post(
  '/',
  authenticate,
  checkActive,
  authorize('MEMBER'),
  validateBody(reviewCreateSchema),
  reviewController.create
);

router.put(
  '/:id',
  authenticate,
  checkActive,
  authorize('MEMBER'),
  validateBody(reviewUpdateSchema),
  reviewController.update
);

export default router;
