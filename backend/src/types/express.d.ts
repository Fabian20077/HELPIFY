import { UserRole } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        departmentId: string | null;
      };
    }
  }
}

export {}; // Asegura que se trate como un módulo

