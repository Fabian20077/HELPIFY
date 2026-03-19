import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No se propocionó token de autenticación',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Inyectar usuario en el request
    (req as any).user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para requerir roles específicos
 * Debe usarse SIEMPRE después de requireAuth
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permisos suficientes para acceder a este recurso',
      });
    }

    return next();
  };
};
