import { Router } from 'express';
import * as attachmentController from '../controllers/attachment.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { uploadLimiter } from '../middlewares/rate-limiter';
import { upload } from '../config/multer.config';

const router = Router();

router.use(requireAuth);

// Upload rate limited: 30 uploads per hour per IP
router.post('/ticket/:id', uploadLimiter, upload.single('file'), attachmentController.uploadAttachment);

router.get('/:id', attachmentController.getAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
