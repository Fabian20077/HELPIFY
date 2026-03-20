// ============================================================================
// Helpify — Auth Utilities (Server-Side)
// Cookie-based JWT session management for Next.js
// ============================================================================

import { cookies } from 'next/headers';
import type { SessionPayload, User } from './types';
import { api } from './api';

export const AUTH_COOKIE_NAME = 'helpify-token';

/**
 * Read the JWT token from the httpOnly cookie (server-side only).
 */
export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Decode JWT payload without verification (for middleware route checks).
 * Full verification happens on the backend when the token is used.
 */
export function decodeTokenPayload(token: string): SessionPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    const payload = JSON.parse(atob(base64Payload));
    return {
      id: payload.id,
      role: payload.role,
      departmentId: payload.departmentId ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from the backend (server-side).
 * Uses the token from cookie to call GET /users/me.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    return await api.get<User>('/users/me', token);
  } catch {
    return null;
  }
}
