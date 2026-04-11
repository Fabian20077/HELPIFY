import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    role: z.enum(['customer', 'agent', 'admin', 'pending']).optional(),
    isActive: z.boolean().optional(),
    departmentId: z.string().uuid().nullable().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  }),
});

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
  }),
});

export const approveUserSchema = z.object({
  body: z.object({
    role: z.enum(['customer', 'agent', 'admin']).optional(),
  }),
});
