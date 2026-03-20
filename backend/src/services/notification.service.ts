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

async function getAdminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'admin', isActive: true },
    select: { id: true }
  });
  return admins.map(a => a.id);
}

async function getRecipients(ticket: { createdById: string; assignedToId: string | null }, excludeId: string): Promise<string[]> {
  const adminIds = await getAdminIds();
  const recipients = new Set<string>();

  recipients.add(ticket.createdById);
  if (ticket.assignedToId) recipients.add(ticket.assignedToId);
  adminIds.forEach(id => recipients.add(id));

  recipients.delete(excludeId);

  return Array.from(recipients);
}

export async function createTicketCreatedNotification(
  ticketId: string,
  ticketTitle: string,
  createdById: string
) {
  const admins = await getAdminIds();
  
  const notifications = admins
    .filter(id => id !== createdById)
    .map(adminId => createNotification({
      userId: adminId,
      ticketId,
      type: NotificationType.status_changed,
      message: `Nuevo ticket creado: "${ticketTitle}"`
    }));

  await Promise.all(notifications);
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

  const recipients = await getRecipients(ticket, changedBy);

  const notifications = recipients.map(userId => createNotification({
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

  const recipients = await getRecipients(ticket, commentAuthorId);

  const notifications = recipients.map(userId => createNotification({
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