import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '@/middlewares/error.middleware';

/**
 * Listar notificaciones del usuario autenticado
 */
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar notificación como leída
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return next(new AppError('Notificación no encontrada', 404));
    }

    if (notification.userId !== req.user!.id) {
      return next(new AppError('No tienes permiso para marcar esta notificación', 403));
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.status(200).json({
      status: 'success',
      data: updatedNotification
    });
  } catch (error) {
    next(error);
  }
};
