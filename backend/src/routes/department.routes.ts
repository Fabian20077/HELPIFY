import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} from '../controllers/department.controller';
import { validateRequest } from '../middlewares/validate-request';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentSchema,
} from '../validators/department.validator';

const router = Router();

// Cualquiera puede ver la lista de departamentos activos (útil para registrarse o asignar tickets)
router.get('/', requireAuth, getDepartments as any);

// Solo autenticados pueden ver el detalle
router.get('/:id', requireAuth, validateRequest(getDepartmentSchema), getDepartmentById as any);

// Solo ADMIN y MANAGER pueden crear y actualizar departamentos
const adminOrManager = requireRole(['admin', 'manager']);

router.post('/', requireAuth, adminOrManager, validateRequest(createDepartmentSchema), createDepartment as any);
router.patch('/:id', requireAuth, adminOrManager, validateRequest(updateDepartmentSchema), updateDepartment as any);

export default router;
