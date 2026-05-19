import { Router } from 'express';
import { membershipController } from '../controllers/membershipController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { checkActive } from '../middlewares/checkActive.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { membershipCreateSchema } from '../validators/membershipValidator.js';

const router = Router();

router.use(authenticate, checkActive, authorize('MEMBER'));

router.get('/me', membershipController.getMyMembership);
router.post('/', validateBody(membershipCreateSchema), membershipController.subscribe);
router.patch('/me/cancel', membershipController.cancel);

export default router;
