import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    description: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Se debe proporcionar al menos un campo para actualizar',
  }),
});

export const getDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});
