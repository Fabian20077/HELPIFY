import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { calculateUrgencyScore } from '../services/urgency-score';
import { validateTransition, isTerminalState, isResolving } from '../services/ticket-state-machine';
import { createStatusChangeNotification, createCommentNotification, createResolvedNotification, createTicketCreatedNotification } from '../services/notification.service';
import { TicketStatus } from '../generated/prisma/client';

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
    const { status, priority, departmentId } = req.query;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    // Construcción de filtros dinámicos
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (departmentId) where.departmentId = departmentId;

    // RNF: Seguridad de acceso basado en rol
    if (userRole === 'customer') {
      where.createdById = userId; // Cliente solo ve sus tickets
    } else if (userRole === 'agent') {
      // Agente ve tickets de su departamento o asignados a él (ejemplo simplificado)
      const agent = await prisma.user.findUnique({ where: { id: userId } });
      if (agent?.departmentId) {
        where.departmentId = agent.departmentId;
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
        history: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular Urgency Score dinámico (RN-12)
    const ticketsWithScore = tickets.map(t => {
      // Calcular horas sin respuesta
      const lastAgentActivity = t.history
        .filter(h => h.changedBy !== t.createdById) // simplificación usando creador vs agente
        .pop();
      
      const lastActivityTime = new Date(lastAgentActivity ? lastAgentActivity.changedAt : t.createdAt);
      const hoursSinceResponse = (Date.now() - lastActivityTime.getTime()) / (1000 * 60 * 60);

      const previousReopenings = t.history.filter(h => 
        h.fieldName === 'status' && h.oldValue === 'resolved' && h.newValue === 'in_progress'
      ).length;

      // Simplificamos historial de usuario por rendimiento en listar todos
      const recentUserTicketsCount = 0; 
      
      // Tiempo en waiting
      let hoursInWaiting = 0;
      if (t.status === 'waiting') {
        const lastTransition = t.history.filter(h => h.fieldName === 'status' && h.newValue === 'waiting').pop();
        if (lastTransition) {
          hoursInWaiting = (Date.now() - new Date(lastTransition.changedAt).getTime()) / (1000 * 60 * 60);
        }
      }

      const urgencyScoreResult = calculateUrgencyScore({
        hoursSinceLastActivity: hoursSinceResponse,
        reopenCount: previousReopenings,
        userRecentTicketCount: recentUserTicketsCount,
        hoursInWaiting: hoursInWaiting
      });

      return {
        ...t,
        urgencyScore: urgencyScoreResult.total
      };
    });

    // Ordenar por score de urgencia de mayor a menor
    ticketsWithScore.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return res.status(200).json({ status: 'success', data: ticketsWithScore });
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
        history: { orderBy: { changedAt: 'desc' } }
      },
    });

    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket no encontrado' });

    // Filtrar notas internas si el usuario es customer
    const userRole = (req as any).user.role;
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

    // Validar máquina de estados usando el servicio core
    validateTransition(ticket.status as TicketStatus, status as TicketStatus);

    // Actualizar estado y registrar en historial
    const updatedTicket = await prisma.$transaction(async (tx) => {
      const data: any = { status };
      
      if (isResolving(status as TicketStatus)) {
        data.resolvedAt = new Date();
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

    // Crear notificaciones
    await createStatusChangeNotification(id, oldStatus, status, userId, ticket.title);
    
    // Si se resolvió, notificar al creador
    if (status === 'resolved') {
      await createResolvedNotification(id, ticket.title);
    }

    return res.status(200).json({ status: 'success', data: updatedTicket });
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

    // Un customer no puede hacer notas internas
    if (userRole === 'customer') {
      commentData.isInternal = false;
    }

    const comment = await prisma.comment.create({
      data: commentData
    });

    // Crear notificación (solo para comentarios públicos)
    await createCommentNotification(id, userId, ticket.title, isInternal || false);

    return res.status(201).json({ status: 'success', data: comment });
  } catch (error) {
    next(error);
  }
};
