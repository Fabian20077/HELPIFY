import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
