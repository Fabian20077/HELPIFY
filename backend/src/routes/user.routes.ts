import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request';
import { updateUserSchema, updateMeSchema, approveUserSchema } from '../validators/user.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Ruta para el propio usuario
router.get('/me', userController.getMe);

// Lista de agentes y admins disponibles para asignación
router.get('/agents', userController.getAgents);

// Búsqueda de usuarios para observadores
router.get('/search', userController.searchUsers);

// Rutas administrativas
router.get('/', requireRole(['admin']), userController.getAllUsers);
router.patch('/:id', requireRole(['admin']), validateRequest(updateUserSchema), userController.updateUser);
router.delete('/:id', requireRole(['admin']), userController.deleteUser);

// Rutas para aprobación/rechazo de usuarios pendientes
router.post('/:id/approve', requireRole(['admin']), validateRequest(approveUserSchema), userController.approveUser);
router.post('/:id/reject', requireRole(['admin']), userController.rejectUser);

export default router;
