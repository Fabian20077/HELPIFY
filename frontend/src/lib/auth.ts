// ============================================================================
// Helpify — Auth Utilities (localStorage-based)
// Since frontend and backend are on different domains,
// we store the JWT token in localStorage (accessible to both).
// ============================================================================

import type { SessionPayload, User } from './types';

export const AUTH_TOKEN_KEY = 'helpify-auth-token';

/**
 * Read the JWT token from localStorage (client-side).
 * For server-side, returns undefined — components should use client-side rendering.
 */
export function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
}

/**
 * Store the JWT token in localStorage.
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Remove the JWT token from localStorage.
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Decode JWT payload without verification (for role checks in client components).
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
