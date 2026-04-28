import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validateBody.js';
import { registerSchema, loginSchema, updateMeSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validateBody(updateMeSchema), authController.updateMe);

export default router;
