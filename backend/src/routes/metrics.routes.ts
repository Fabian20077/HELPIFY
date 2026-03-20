import { Router } from 'express';
import { getMetrics } from '../controllers/metrics.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getMetrics as any);

export default router;
