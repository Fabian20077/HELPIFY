import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middlewares/error.middleware';

const uploadDir = path.join(process.cwd(), 'uploads');

// Asegurar que el directorio de descargas existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB (RN-07)
  },
  fileFilter: (_req, file, cb) => {
    // Primera capa: Filtro por extensión básico
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Tipo de archivo no permitido por extensión', 400) as any, false);
    }
  }
});
