import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Buscar al usuario por su email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas o cuenta desactivada',
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas o cuenta desactivada',
      });
    }

    // Generar Token JWT
    const token = signToken({
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    // Retornar información del usuario (sin el hash)
    return res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, departmentId } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'El correo electrónico ya está registrado',
      });
    }

    // Encriptar la contraseña (hashing)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        departmentId: departmentId || null,
        // Al registrar por fuera, por defecto es un customer. Los admins los configuran luego.
        role: 'customer',
      },
    });

    // Generar Token
    const token = signToken({
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
