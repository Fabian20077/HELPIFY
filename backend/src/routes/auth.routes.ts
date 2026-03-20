import { Router } from 'express';
import { login, register, logout, getMe } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request';
import { requireAuth } from '../middlewares/auth.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validateRequest(loginSchema), login as any);

router.post('/register', validateRequest(registerSchema), register as any);

router.post('/logout', logout);

router.get('/me', requireAuth, getMe);

export default router;
