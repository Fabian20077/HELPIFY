import { prisma } from '../lib/prisma';
import { NotificationType } from '../generated/prisma/client';

interface CreateNotificationParams {
  userId: string;
  ticketId: string;
  type: NotificationType;
  message: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: params
  });
}

export async function createStatusChangeNotification(
  ticketId: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  ticketTitle: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { createdById: true, assignedToId: true }
  });

  if (!ticket) return;

  const statusLabels: Record<string, string> = {
    open: 'Abierto',
    in_progress: 'En Progreso',
    waiting: 'En Espera',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  };

  const message = `Ticket "${ticketTitle}" cambió de ${statusLabels[oldStatus] || oldStatus} a ${statusLabels[newStatus] || newStatus}`;

  const recipients = [ticket.createdById];
  if (ticket.assignedToId && ticket.assignedToId !== changedBy) {
    recipients.push(ticket.assignedToId);
  }

  const notifications = recipients
    .filter(id => id !== changedBy)
    .map(userId => createNotification({
      userId,
      ticketId,
      type: NotificationType.status_changed,
      message
    }));

  await Promise.all(notifications);
}

export async function createCommentNotification(
  ticketId: string,
  commentAuthorId: string,
  ticketTitle: string,
  isInternal: boolean
) {
  if (isInternal) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { createdById: true, assignedToId: true }
  });

  if (!ticket) return;

  const message = `Nuevo comentario en "${ticketTitle}"`;

  const recipients = [ticket.createdById];
  if (ticket.assignedToId && ticket.assignedToId !== commentAuthorId) {
    recipients.push(ticket.assignedToId);
  }

  const notifications = recipients
    .filter(id => id !== commentAuthorId)
    .map(userId => createNotification({
      userId,
      ticketId,
      type: NotificationType.commented,
      message
    }));

  await Promise.all(notifications);
}

export async function createAssignmentNotification(
  ticketId: string,
  assignedToId: string,
  ticketTitle: string
) {
  const message = `Te han asignado el ticket: "${ticketTitle}"`;

  return createNotification({
    userId: assignedToId,
    ticketId,
    type: NotificationType.ticket_assigned,
    message
  });
}

export async function createResolvedNotification(
  ticketId: string,
  ticketTitle: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { createdById: true }
  });

  if (!ticket) return;

  const message = `Tu ticket "${ticketTitle}" ha sido marcado como resuelto`;

  return createNotification({
    userId: ticket.createdById,
    ticketId,
    type: NotificationType.resolved,
    message
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false }
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
}