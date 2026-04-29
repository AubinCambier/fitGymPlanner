import { Router } from 'express';
import { sanctionController } from '../controllers/sanctionController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateBody } from '../middlewares/validateBody.js';
import { sanctionCreateSchema, sanctionUpdateSchema } from '../validators/sanctionValidator.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', sanctionController.getAll);
router.get('/:id', sanctionController.getById);
router.post('/', validateBody(sanctionCreateSchema), sanctionController.create);
router.patch('/:id', validateBody(sanctionUpdateSchema), sanctionController.update);

export default router;
