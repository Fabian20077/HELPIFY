import { Router } from 'express';
import * as attachmentController from '../controllers/attachment.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../config/multer.config';

const router = Router();

router.use(requireAuth);

// Subida vinculada a un ticket
router.post('/ticket/:id', upload.single('file'), attachmentController.uploadAttachment);

// Gestión individual
router.get('/:id', attachmentController.getAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
