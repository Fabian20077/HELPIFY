import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/middlewares/error.middleware';

/**
 * Listar categorías
 */
export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;

    const categories = await prisma.category.findMany({
      where,
      include: {
        department: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear categoría (Solo Admin/Manager)
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, color, departmentId } = req.body;

    // Verificar que el departamento existe
    const dept = await prisma.department.findUnique({ where: { id: departmentId as string } });
    if (!dept) {
      return next(new AppError('El departamento especificado no existe', 404));
    }

    const category = await prisma.category.create({
      data: { name, color, departmentId }
    });

    res.status(201).json({
      status: 'success',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar categoría (Solo Admin)
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.id as string;
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return next(new AppError('Categoría no encontrada', 404));
    }

    await prisma.category.delete({ where: { id: categoryId } });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
