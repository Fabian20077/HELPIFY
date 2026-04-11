import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { calculateUrgencyScore } from '../services/urgency-score';
import { validateTransition, isTerminalState, isResolving, isReopening } from '../services/ticket-state-machine';
import { createStatusChangeNotification, createCommentNotification, createResolvedNotification, createTicketCreatedNotification, createAssignmentNotification } from '../services/notification.service';
import { TicketStatus } from '../generated/prisma/client';
import logger from '../lib/logger';

const ticketInclude = {
  createdBy: { select: { name: true, email: true } },
  assignedTo: { select: { name: true, email: true } },
  department: { select: { name: true } },
  category: { select: { name: true } },
  comments: {
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'asc' as const }
  },
  attachments: true,
  history: { orderBy: { changedAt: 'desc' as const } }
};

async function getTicketWithRelations(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: ticketInclude
  });
}

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, departmentId, categoryId, priority } = req.body;
    const userId = (req as any).user.id;

    // Validación RN-13 (si se envían categoría y departamento, deben coincidir)
    if (categoryId && departmentId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (category && category.departmentId !== departmentId) {
        return res.status(400).json({ status: 'error', message: 'La categoría no pertenece al departamento seleccionado' });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        createdById: userId,
        departmentId,
        categoryId,
        priority: priority || 'medium',
      },
    });

    await createTicketCreatedNotification(ticket.id, title, userId);

    return res.status(201).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, departmentId, assignedToId, page, limit } = req.query;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    // Pagination params
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Construcción de filtros dinámicos
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (departmentId) where.departmentId = departmentId;
    if (assignedToId === 'null' || assignedToId === 'unassigned') where.assignedToId = null;
    else if (assignedToId) where.assignedToId = assignedToId;

    // RNF: Seguridad de acceso basado en rol
    if (userRole === 'customer') {
      where.createdById = userId; // Cliente solo ve sus tickets
    } else if (userRole === 'agent') {
      const agent = await prisma.user.findUnique({ where: { id: userId } });
      if (agent?.departmentId) {
        where.departmentId = agent.departmentId;
      }
    }

    // Get total count for pagination
    const total = await prisma.ticket.count({ where });

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
        history: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    const ticketsWithScore = tickets.map(t => {
      const lastAgentActivity = t.history
        .filter(h => h.changedBy !== t.createdById)
        .pop();

      const lastActivityTime = lastAgentActivity
        ? new Date(lastAgentActivity.changedAt)
        : new Date(t.createdAt);
      const hoursSinceResponse = (Date.now() - lastActivityTime.getTime()) / (1000 * 60 * 60);

      const previousReopenings = t.history.filter(h =>
        h.fieldName === 'status' && h.oldValue === 'resolved' && h.newValue === 'in_progress'
      ).length;

      let hoursInWaiting = 0;
      if (t.status === 'waiting') {
        const lastTransition = t.history
          .filter(h => h.fieldName === 'status' && h.newValue === 'waiting')
          .pop();
        if (lastTransition) {
          hoursInWaiting = (Date.now() - new Date(lastTransition.changedAt).getTime()) / (1000 * 60 * 60);
        }
      }

      const urgencyScoreResult = calculateUrgencyScore({
        hoursSinceLastActivity: hoursSinceResponse,
        reopenCount: previousReopenings,
        userRecentTicketCount: 0,
        hoursInWaiting,
      });

      return { ...t, urgencyScore: urgencyScoreResult.total };
    });

    ticketsWithScore.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      status: 'success',
      data: ticketsWithScore,
      pagination: {
        total,
        page: pageNum,
        pages: totalPages,
        limit: limitNum,
        prev: pageNum > 1 ? pageNum - 1 : null,
        next: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        department: { select: { name: true } },
        category: { select: { name: true } },
        comments: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        },
        attachments: true,
        history: { orderBy: { changedAt: 'desc' } },
        observers: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
    });

    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });

    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    
    const observerIds = ticket.observers.map(o => o.userId);
    const canViewAsCustomer = 
      ticket.createdById === userId || 
      ticket.assignedToId === userId || 
      observerIds.includes(userId);
    
    if (userRole === 'customer' && !canViewAsCustomer) {
      return res.status(403).json({ status: 'error', message: 'No tienes permisos para ver este ticket' });
    }
    if (userRole === 'customer') {
      ticket.comments = ticket.comments.filter(c => !c.isInternal);
    }

    return res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });

    const oldStatus = ticket.status;

    validateTransition(ticket.status as TicketStatus, status as TicketStatus);

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const data: any = { status };

      if (isResolving(status as TicketStatus)) {
        data.resolvedAt = new Date();
      }

      if (isReopening(ticket.status as TicketStatus, status as TicketStatus)) {
        data.resolvedAt = null;
      }

      const updated = await tx.ticket.update({
        where: { id },
        data
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          changedBy: userId,
          fieldName: 'status',
          oldValue: oldStatus,
          newValue: status
        }
      });

      return updated;
    });

    await createStatusChangeNotification(id, oldStatus, status, userId, ticket.title);

    if (status === 'resolved') {
      await createResolvedNotification(id, ticket.title);
    }

    const ticketWithRelations = await getTicketWithRelations(id);
    return res.status(200).json({ status: 'success', data: ticketWithRelations });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Transición de estado inválida')) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { body, isInternal } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });

    if (isTerminalState(ticket.status as TicketStatus)) {
      return res.status(400).json({ status: 'error', message: 'No se pueden añadir comentarios a un ticket cerrado' });
    }

    const commentData: any = {
      ticketId: id,
      authorId: userId,
      body,
      isInternal: isInternal || false
    };

    if (userRole === 'customer') {
      commentData.isInternal = false;
    }

    const comment = await prisma.comment.create({
      data: commentData
    });

    await createCommentNotification(id, userId, ticket.title, isInternal || false);

    return res.status(201).json({ status: 'success', data: comment });
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { assignedToId } = req.body;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });
    }

    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!assignee) {
        return res.status(400).json({
          status: 'error',
          message: 'El usuario especificado no existe'
        });
      }

      if (!assignee.isActive) {
        return res.status(400).json({
          status: 'error',
          message: 'No se puede asignar a un usuario desactivado'
        });
      }

      if (assignee.role !== 'agent' && assignee.role !== 'admin') {
        return res.status(400).json({
          status: 'error',
          message: 'Solo se puede asignar a usuarios con rol agente o administrador'
        });
      }
    }

    const oldAssignedToId = ticket.assignedToId;

    if (oldAssignedToId === assignedToId) {
      return res.status(200).json({
        status: 'success',
        data: ticket,
        message: 'El ticket ya está asignado a este usuario'
      });
    }

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: { assignedToId: assignedToId || null }
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          changedBy: userId,
          fieldName: 'assignedToId',
          oldValue: oldAssignedToId,
          newValue: assignedToId || null
        }
      });

      return updated;
    });

    if (assignedToId) {
      await createAssignmentNotification(id, assignedToId, ticket.title);
    }

    const ticketWithRelations = await getTicketWithRelations(id);
    return res.status(200).json({ status: 'success', data: ticketWithRelations });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({ where: { ticketId: id } });
      await tx.attachment.deleteMany({ where: { ticketId: id } });
      await tx.ticketHistory.deleteMany({ where: { ticketId: id } });
      await tx.notification.deleteMany({ where: { ticketId: id } });
      await tx.ticket.delete({ where: { id } });
    });

    logger.info(`Ticket eliminado`, {
      ticketId: id,
      ticketTitle: ticket.title,
      deletedBy: userId,
      deletedAt: new Date().toISOString(),
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Agregar observador a un ticket
 */
export const addObserver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = req.params.id as string;
    const { userId: observerUserId } = req.body;
    const currentUserId = (req as any).user.id;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });
    }

    const observerUser = await prisma.user.findUnique({ where: { id: observerUserId } });
    if (!observerUser) {
      return res.status(400).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    const existingObserver = await prisma.ticketObserver.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId: observerUserId
        }
      }
    });

    if (existingObserver) {
      return res.status(400).json({ status: 'error', message: 'El usuario ya es observador de este ticket' });
    }

    const observer = await prisma.ticketObserver.create({
      data: {
        ticketId,
        userId: observerUserId
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId,
        changedBy: currentUserId,
        fieldName: 'observer_added',
        oldValue: null,
        newValue: observerUser.name
      }
    });

    return res.status(201).json({ status: 'success', data: observer });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar observador de un ticket
 */
export const removeObserver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = req.params.id as string;
    const observerUserId = req.params.userId as string;
    const currentUserId = (req as any).user.id;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });
    }

    const observer = await prisma.ticketObserver.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId: observerUserId
        }
      }
    });

    if (!observer) {
      return res.status(404).json({ status: 'error', message: 'El usuario no es observador de este ticket' });
    }

    const observerUser = await prisma.user.findUnique({ where: { id: observerUserId } });

    await prisma.ticketObserver.delete({
      where: { id: observer.id }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId,
        changedBy: currentUserId,
        fieldName: 'observer_removed',
        oldValue: observerUser?.name || observerUserId,
        newValue: null
      }
    });

    return res.status(200).json({ status: 'success', message: 'Observador eliminado' });
  } catch (error) {
    next(error);
  }
};
