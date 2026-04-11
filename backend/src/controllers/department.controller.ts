import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getDepartments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ status: 'success', data: departments });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, role: true } },
      },
    });

    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Departamento no encontrado' });
    }

    return res.status(200).json({ status: 'success', data: department });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    
    // Check si existe
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Ya existe un departamento con ese nombre' });
    }

    const department = await prisma.department.create({
      data: { name, description },
    });

    return res.status(201).json({ status: 'success', data: department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    // Check si el nombre nuevo ya está en uso
    if (name) {
      const existing = await prisma.department.findUnique({ where: { name } });
      if (existing && existing.id !== id) {
        return res.status(409).json({ status: 'error', message: 'El nombre ya está en uso por otro departamento' });
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name, description },
    });

    return res.status(200).json({ status: 'success', data: department });
  } catch (error) {
    // Prisma tira error si no lo encuentra, lo manejamos genérico o específico P2025
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Departamento no encontrado' });
    }
    next(error);
  }
};
