import { Router } from 'express';
import { login, register, logout, refresh } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authLimiter } from '../middlewares/rate-limiter';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', authLimiter, validateRequest(loginSchema), login as any);

router.post('/register', authLimiter, validateRequest(registerSchema), register as any);

router.post('/refresh', refresh as any);

router.post('/logout', logout);

// GET /me is served by /api/users/me (user controller)
// to avoid duplicate implementations.

export default router;
