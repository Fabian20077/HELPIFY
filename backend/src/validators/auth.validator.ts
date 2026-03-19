import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Debe ser un correo electrónico válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Debe ser un correo electrónico válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    // Por defecto se podría requerir un departamento para register, pero lo dejamos opcional
    departmentId: z.string().uuid().optional(),
  }),
});
