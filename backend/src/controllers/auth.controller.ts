import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Buscar al usuario por su email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas',
      });
    }

    if (user.deletedAt) {
      return res.status(401).json({
        status: 'error',
        message: 'Tu cuenta ha sido eliminada. Contacta a un administrador.',
      });
    }

    if (user.role === 'pending') {
      return res.status(403).json({
        status: 'error',
        message: 'Tu cuenta está pendiente de aprobación. Contacta a un administrador.',
        pending: true,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Tu cuenta ha sido desactivada. Contacta a un administrador.',
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas',
      });
    }

    // Generar Access Token (8h) y Refresh Token (7d)
    const token = signToken({
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    const refreshToken = signRefreshToken(user.id);

    // Access token: cookie httpOnly de corta duración
    res.cookie('helpify-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8h
      path: '/',
    });

    // Refresh token: cookie httpOnly de larga duración
    res.cookie('helpify-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
      path: '/',
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

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('helpify-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie('helpify-refresh-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({
    status: 'success',
    message: 'Sesión cerrada correctamente',
  });
};

/**
 * Renovar access token usando el refresh token almacenado en cookie httpOnly
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies['helpify-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'No hay token de renovación',
      });
    }

    // Verificar refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Buscar usuario y verificar que siga activo
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user || !user.isActive || user.role === 'pending' || user.deletedAt) {
      res.clearCookie('helpify-refresh-token');
      return res.status(401).json({
        status: 'error',
        message: 'Sesión inválida',
      });
    }

    // Generar nuevo access token
    const newToken = signToken({
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    // Renovar refresh token (rotación)
    const newRefreshToken = signRefreshToken(user.id);

    res.cookie('helpify-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('helpify-refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({
      status: 'success',
      data: { token: newToken },
    });
  } catch (error) {
    // Token inválido o expirado
    res.clearCookie('helpify-refresh-token');
    return res.status(401).json({
      status: 'error',
      message: 'Token de renovación inválido o expirado',
    });
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

    // Crear el nuevo usuario con rol 'pending' para aprobación del admin
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        departmentId: departmentId || null,
        role: 'pending',
        isActive: false,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.',
      data: {
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
