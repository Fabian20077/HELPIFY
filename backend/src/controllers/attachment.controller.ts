import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import { validateMagicBytes, ALLOWED_MIMES } from '../utils/file-validator';
import fs from 'fs';
import path from 'path';

/**
 * Subir adjunto a un ticket
 */
export const uploadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = req.params.id as string;
    const file = req.file;

    if (!file) {
      return next(new AppError('No se subió ningún archivo', 400));
    }

    // RN-07: Validación estricta por Magic Bytes
    const realMime = validateMagicBytes(file.path);
    const extension = path.extname(file.originalname).toLowerCase();
    
    const isImagePath = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension);
    const isPdfPath = extension === '.pdf';

    // 1. Si la extensión dice ser una imagen o PDF, los Magic Bytes DEBEN coincidir
    if (isImagePath && (!realMime || !realMime.startsWith('image/'))) {
      fs.unlinkSync(file.path);
      return next(new AppError(`Archivo corrupto o sospechoso detectado. La extensión no coincide con el contenido real.`, 400));
    }

    if (isPdfPath && realMime !== 'application/pdf') {
      fs.unlinkSync(file.path);
      return next(new AppError(`Archivo PDF inválido o corrupto detectado.`, 400));
    }

    // 2. Si se detectó un MIME real pero no está en la lista permitida (ej: .exe camuflado como algo más)
    if (realMime && !ALLOWED_MIMES.includes(realMime)) {
      fs.unlinkSync(file.path);
      return next(new AppError(`Contenido binario no permitido (${realMime}).`, 400));
    }

    // Verificar existencia del ticket
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      fs.unlinkSync(file.path);
      return next(new AppError('Ticket no encontrado', 404));
    }

    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    if (userRole === 'customer' && ticket.createdById !== userId) {
      fs.unlinkSync(file.path);
      return next(new AppError('No tienes permisos para subir archivos a este ticket', 403));
    }

    // Registrar en BD
    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        uploadedBy: (req as any).user.id,
        filename: file.originalname,
        mimeType: realMime || file.mimetype,
        sizeBytes: file.size,
        storageKey: file.filename
      }
    });

    res.status(201).json({
      status: 'success',
      data: attachment
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

/**
 * Descargar/Ver adjunto
 */
export const getAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attachmentId = req.params.id as string;

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) {
      return next(new AppError('Adjunto no encontrado', 404));
    }

    const filePath = path.join(process.cwd(), 'uploads', attachment.storageKey);
    
    if (!fs.existsSync(filePath)) {
      return next(new AppError('Archivo físico no encontrado en el servidor', 404));
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar adjunto
 */
export const deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attachmentId = req.params.id as string;

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) {
      return next(new AppError('Adjunto no encontrado', 404));
    }

    // Seguridad: Solo el autor o un Admin puede borrar
    if (attachment.uploadedBy !== (req as any).user.id && (req as any).user.role !== 'admin') {
      return next(new AppError('No tienes permiso para eliminar este archivo', 403));
    }

    // 1. Borrar archivo físico
    const filePath = path.join(process.cwd(), 'uploads', attachment.storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 2. Borrar de BD
    await prisma.attachment.delete({ where: { id: attachmentId } });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
