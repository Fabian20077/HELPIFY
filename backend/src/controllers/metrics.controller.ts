import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { computeTicketUrgencyScore } from '../services/ticket-urgency-helper';
import { TicketStatus } from '../generated/prisma/client';

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { role, id: userId } = user;

    if (role === 'customer') {
      const [open, in_progress, waiting, resolved, closed] = await Promise.all([
        prisma.ticket.count({ where: { createdById: userId, status: 'open' } }),
        prisma.ticket.count({ where: { createdById: userId, status: 'in_progress' } }),
        prisma.ticket.count({ where: { createdById: userId, status: 'waiting' } }),
        prisma.ticket.count({ where: { createdById: userId, status: 'resolved' } }),
        prisma.ticket.count({ where: { createdById: userId, status: 'closed' } }),
      ]);

      const recentTickets = await prisma.ticket.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          history: {
            select: {
              changedBy: true,
              changedAt: true,
              fieldName: true,
              oldValue: true,
              newValue: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      const recentWithScore = recentTickets.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        urgencyScore: computeTicketUrgencyScore(t as any),
      }));

      return res.status(200).json({
        status: 'success',
        data: {
          total: open + in_progress + waiting + resolved + closed,
          byStatus: { open, in_progress, waiting, resolved, closed },
          recentTickets: recentWithScore,
        },
      });
    }

    if (role === 'agent') {
      const byStatus = await prisma.ticket.groupBy({
        by: ['status'],
        where: { assignedToId: userId },
        _count: { id: true },
      });

      const statusMap: Record<string, number> = { open: 0, in_progress: 0, waiting: 0, resolved: 0, closed: 0 };
      for (const row of byStatus) {
        statusMap[row.status] = row._count.id;
      }

      const totalAssigned = Object.values(statusMap).reduce((a, b) => a + b, 0);

      const recentAssigned = await prisma.ticket.findMany({
        where: { assignedToId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          history: {
            select: {
              changedBy: true,
              changedAt: true,
              fieldName: true,
              oldValue: true,
              newValue: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });

      const recentWithScore = recentAssigned.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        urgencyScore: computeTicketUrgencyScore(t as any),
      }));

      return res.status(200).json({
        status: 'success',
        data: {
          totalAssigned,
          byStatus: statusMap,
          recentAssigned: recentWithScore,
        },
      });
    }

    if (role === 'admin') {
      const [byStatus, unassignedCount, resolvedTicketsData] = await Promise.all([
        prisma.ticket.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.ticket.count({ where: { assignedToId: null } }),
        prisma.ticket.findMany({
          where: { resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true },
        }),
      ]);

      const statusMap: Record<string, number> = { open: 0, in_progress: 0, waiting: 0, resolved: 0, closed: 0 };
      for (const row of byStatus) {
        statusMap[row.status] = row._count.id;
      }

      const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

      let avgResolutionHours = 0;
      if (resolvedTicketsData.length > 0) {
        const totalMs = resolvedTicketsData.reduce((sum, t) => {
          return sum + (t.resolvedAt!.getTime() - new Date(t.createdAt).getTime());
        }, 0);
        avgResolutionHours = Math.round((totalMs / resolvedTicketsData.length) / (1000 * 60 * 60) * 10) / 10;
      }

      return res.status(200).json({
        status: 'success',
        data: {
          total,
          unassigned: unassignedCount,
          byStatus: statusMap,
          avgResolutionHours,
          resolvedCount: resolvedTicketsData.length,
        },
      });
    }

    return res.status(403).json({ status: 'error', message: 'Rol no reconocido' });
  } catch (error) {
    next(error);
  }
};
