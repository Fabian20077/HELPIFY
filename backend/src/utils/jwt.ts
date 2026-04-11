import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  role: string;
  departmentId: string | null;
}

export interface RefreshPayload {
  id: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const JWT_REFRESH_EXPIRES_IN = '7d';

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
};
