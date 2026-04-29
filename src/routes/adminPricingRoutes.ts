import { Router } from 'express';
import { pricingController } from '../controllers/pricingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { pricingCreateSchema, pricingUpdateSchema } from '../validators/pricingValidator.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', pricingController.getAll);
router.post('/', validateBody(pricingCreateSchema), pricingController.create);
router.put('/:id', validateBody(pricingUpdateSchema), pricingController.update);
router.patch('/:id/status', pricingController.setStatus);

export default router;
