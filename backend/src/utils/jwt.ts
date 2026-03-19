import jwt from 'jsonwebtoken';
import { UserRole } from '../generated/prisma/client';

export interface TokenPayload {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
