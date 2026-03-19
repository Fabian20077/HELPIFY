import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request';
import { createCategorySchema } from '../validators/category.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

router.get('/', categoryController.getAllCategories);

// Solo Admin o Manager pueden crear/borrar
router.post('/', requireRole(['admin', 'agent']), validateRequest(createCategorySchema), categoryController.createCategory);
router.delete('/:id', requireRole(['admin']), categoryController.deleteCategory);

export default router;
