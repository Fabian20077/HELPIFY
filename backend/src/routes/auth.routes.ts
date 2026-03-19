import { Router } from 'express';
import { login, register, logout } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), login as any);

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), register as any);

// POST /api/auth/logout
router.post('/logout', logout);

export default router;
