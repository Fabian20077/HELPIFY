import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(255),
    description: z.string().min(10, 'La descripción debe ser detallada (mínimo 10 caracteres)'),
    departmentId: z.string().uuid('ID de departamento inválido').optional(),
    categoryId: z.string().uuid('ID de categoría inválido').optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }),
});

export const updateTicketStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ticket inválido'),
  }),
  body: z.object({
    status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']),
  }),
});

export const assignTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ticket inválido'),
  }),
  body: z.object({
    assignedToId: z.string().uuid('ID de usuario asignado inválido'),
  }),
});

export const addCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ticket inválido'),
  }),
  body: z.object({
    body: z.string().min(1, 'El comentario no puede estar vacío'),
    isInternal: z.boolean().optional(),
  }),
});
