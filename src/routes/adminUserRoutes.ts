import { Router } from 'express';
import { adminUserController } from '../controllers/adminUserController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { adminUserCreateSchema, adminUserUpdateSchema } from '../validators/adminUserValidator.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', adminUserController.getAll);
router.get('/:id', adminUserController.getById);
router.post('/', validateBody(adminUserCreateSchema), adminUserController.create);
router.put('/:id', validateBody(adminUserUpdateSchema), adminUserController.update);
router.patch('/:id/status', adminUserController.setStatus);

export default router;
