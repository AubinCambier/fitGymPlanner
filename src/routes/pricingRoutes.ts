import { Router } from 'express';
import { pricingController } from '../controllers/pricingController.js';

const router = Router();

router.get('/', pricingController.getPublic);

export default router;
