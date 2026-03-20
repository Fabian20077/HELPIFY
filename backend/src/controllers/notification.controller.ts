import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '@/middlewares/error.middleware';
import { markAllAsRead } from '../services/notification.service';

/**
 * Listar notificaciones del usuario autenticado con conteo de no leídas
 */
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          ticket: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      unreadCount,
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
    const userId = (req as any).user.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return next(new AppError('Notificación no encontrada', 404));
    }

    if (notification.userId !== userId) {
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

/**
 * Marcar todas las notificaciones como leídas
 */
export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await markAllAsRead(userId);

    res.status(200).json({
      status: 'success',
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    next(error);
  }
};
