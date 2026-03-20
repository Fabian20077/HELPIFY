import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request';
import { createCategorySchema } from '../validators/category.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

router.get('/', categoryController.getAllCategories);

// Solo Admin pueden crear/editar/borrar
router.post('/', requireRole(['admin']), validateRequest(createCategorySchema), categoryController.createCategory);
router.patch('/:id', requireRole(['admin']), categoryController.updateCategory);
router.delete('/:id', requireRole(['admin']), categoryController.deleteCategory);

export default router;
