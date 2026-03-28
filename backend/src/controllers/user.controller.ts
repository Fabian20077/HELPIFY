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

    const where: any = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

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
