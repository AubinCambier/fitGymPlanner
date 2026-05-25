import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { checkActive } from '../middlewares/checkActive.js'
import { authorize } from '../middlewares/authorize.js'
import { dashboardController } from '../controllers/dashboardController.js'

const router = Router()

router.get('/', authenticate, checkActive, authorize('ADMIN'), dashboardController.getStats)

export default router
