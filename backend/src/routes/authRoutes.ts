import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validateBody.js';
import { registerSchema, loginSchema, updateMeSchema } from '../validators/authValidator.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', code: 429, message: 'Too many login attempts, please try again in 15 minutes.' },
});

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validateBody(updateMeSchema), authController.updateMe);

export default router;
