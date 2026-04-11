import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';

/**
 * Obtener perfil del usuario autenticado
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      include: {
        department: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    // Omitir el hash de contraseña
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todos los usuarios (Solo Admin)
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const status = req.query.status as string | undefined; // 'pending' or 'processed'
    const showDeleted = req.query.showDeleted === 'true';

    const where: any = {};
    if (!showDeleted) where.deletedAt = null; // Exclude soft-deleted by default
    if (showDeleted) where.deletedAt = { not: null }; // Only show deleted
    if (role && role !== 'all') where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (status === 'pending') where.role = 'pending';
    if (status === 'processed') where.role = { not: 'pending' };

    const users = await prisma.user.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

    res.status(200).json({
      status: 'success',
      results: sanitizedUsers.length,
      data: sanitizedUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar usuario (Solo Admin)
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string;
    const updateData = req.body as any;

    console.log('=== UPDATE USER DEBUG ===');
    console.log('userId:', userId);
    console.log('updateData:', JSON.stringify(updateData));

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    console.log('Current user departmentId:', user.departmentId);
    console.log('New departmentId from request:', updateData.departmentId);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        role: updateData.role,
        isActive: updateData.isActive,
        departmentId: updateData.departmentId,
      },
      include: {
        department: {
          select: { id: true, name: true }
        }
      }
    });
    console.log('Updated user with department:', updatedUser);

    const { passwordHash, department, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      status: 'success',
      data: {
        ...userWithoutPassword,
        department
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar agentes y admins disponibles para asignación (agentes workload)
 */
export const getAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: { in: ['agent', 'admin'] },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            assignedTickets: {
              where: {
                status: { in: ['open', 'in_progress'] }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const agentsWithWorkload = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      department: agent.department,
      workload: agent._count.assignedTickets
    }));

    res.status(200).json({
      status: 'success',
      results: agentsWithWorkload.length,
      data: agentsWithWorkload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar usuarios por nombre o email
 */
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string || '';

    if (query.length < 2) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 10
    });

    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * Aprobar un usuario pendiente (Solo Admin)
 * Cambia el rol de 'pending' a 'customer' y activa la cuenta
 */
export const approveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    if (user.role !== 'pending') {
      return next(new AppError('Este usuario ya ha sido procesado', 400));
    }

    const approvedRole = role || 'customer';
    const validRoles = ['customer', 'agent', 'admin'];

    if (!validRoles.includes(approvedRole)) {
      return next(new AppError('Rol inválido', 400));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: approvedRole,
        isActive: true,
      },
      include: {
        department: {
          select: { id: true, name: true }
        }
      }
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      status: 'success',
      message: 'Usuario aprobado exitosamente',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rechazar un usuario pendiente (Solo Admin)
 * Elimina el usuario del sistema
 */
export const rejectUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    if (user.role !== 'pending') {
      return next(new AppError('Solo se pueden rechazar usuarios pendientes', 400));
    }

    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({
      status: 'success',
      message: 'Usuario rechazado y eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un usuario permanentemente (Solo Admin)
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    if (user.deletedAt) {
      return next(new AppError('El usuario ya fue eliminado', 400));
    }

    // No permitir que un admin se elimine a sí mismo
    const adminId = (req as any).user.id;
    if (userId === adminId) {
      return next(new AppError('No puedes eliminar tu propia cuenta', 400));
    }

    // Reasignar tickets asignados al usuario
    await prisma.ticket.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null }
    });

    // Soft delete: marcar como eliminado en lugar de borrar físicamente
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
