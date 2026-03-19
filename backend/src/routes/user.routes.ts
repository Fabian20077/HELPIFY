import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request';
import { updateUserSchema, updateMeSchema } from '../validators/user.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Ruta para el propio usuario
router.get('/me', userController.getMe);

// Rutas administrativas
router.get('/', requireRole(['admin']), userController.getAllUsers);
router.patch('/:id', requireRole(['admin']), validateRequest(updateUserSchema), userController.updateUser);

export default router;
