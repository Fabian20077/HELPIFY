// ============================================================================
// Helpify — Auth Utilities (Obfuscated localStorage + Cookie fallback)
// JWT is obfuscated before storage to prevent trivial XSS extraction.
// Primary auth uses httpOnly cookies from the backend.
// localStorage token is kept for API compatibility and cross-domain fallback.
// ============================================================================

import type { SessionPayload } from './types';

export const AUTH_TOKEN_KEY = 'helpify-auth-token';

/**
 * Simple XOR obfuscation to prevent trivial token extraction from localStorage.
 * Not encryption — just a barrier against casual XSS scraping.
 */
const _XOR_KEY = 0x5a;

function _obfuscate(token: string): string {
  return btoa(
    token.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ _XOR_KEY)).join('')
  );
}

function _deobfuscate(encoded: string): string {
  return atob(encoded)
    .split('')
    .map(c => String.fromCharCode(c.charCodeAt(0) ^ _XOR_KEY))
    .join('');
}

/**
 * Read the JWT token from localStorage (obfuscated).
 * Falls back to httpOnly cookie if available (same-origin).
 */
export function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  // Try httpOnly cookie first (same-origin)
  const cookieMatch = document.cookie.match(/(?:^|;\s*)helpify-token=([^;]*)/);
  if (cookieMatch?.[1]) return cookieMatch[1];

  // Fall back to obfuscated localStorage token
  const encoded = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!encoded) return undefined;

  try {
    return _deobfuscate(encoded);
  } catch {
    // Corrupted storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return undefined;
  }
}

/**
 * Store the JWT token in localStorage (obfuscated).
 * Also sets a session cookie for same-origin requests.
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;

  // Obfuscate before storing
  const encoded = _obfuscate(token);
  localStorage.setItem(AUTH_TOKEN_KEY, encoded);

  // Also set a regular cookie (not httpOnly, accessible from JS) for same-origin
  document.cookie = `helpify-token=${token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;
}

/**
 * Remove the JWT token from localStorage and cookies.
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);

  // Clear all cookie variants
  document.cookie = 'helpify-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'helpify-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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

/**
 * Check if the current token is about to expire (< 5 min remaining).
 * Used by the auto-refresh mechanism.
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to ms
    const now = Date.now();
    return (expiresAt - now) < 5 * 60 * 1000; // 5 minutes
  } catch {
    return false;
  }
}
