import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
    departmentId: z.string().uuid(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    departmentId: z.string().uuid().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  }),
});
