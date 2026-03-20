// ============================================================================
// Helpify — Type-safe API Client
// Wraps fetch with error handling matching backend response format.
// Server-side: reads token from cookie. Client-side: uses credentials.
// ============================================================================

import type { ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public status: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  token?: string;
}

/**
 * Type-safe fetch wrapper for the Helpify backend API.
 * 
 * - On the server (RSC), pass `token` explicitly from the cookie.
 * - On the client, the proxy API routes handle cookie forwarding.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let processedBody: BodyInit | undefined;

  if (body instanceof FormData) {
    processedBody = body;
    // Don't set Content-Type — browser sets it with boundary
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    processedBody = JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: processedBody,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || `Error ${response.status}`,
      response.status,
      data.status || 'error',
    );
  }

  return data.data as T;
}

/**
 * Same as apiFetch but returns the full ApiResponse envelope, 
 * preserving pagination and results metadata.
 */
export async function apiFetchFull<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { body, token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let processedBody: BodyInit | undefined;

  if (body instanceof FormData) {
    processedBody = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    processedBody = JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: processedBody,
  });

  if (response.status === 204) {
    return { status: 'success' } as ApiResponse<T>;
  }

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || `Error ${response.status}`,
      response.status,
      data.status || 'error',
    );
  }

  return data;
}

// ── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiFetch<T>(endpoint, { method: 'GET', token }),
    
  getPaginated: <T>(endpoint: string, token?: string) =>
    apiFetchFull<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, body: Record<string, unknown>, token?: string) =>
    apiFetch<T>(endpoint, { method: 'POST', body, token }),

  patch: <T>(endpoint: string, body: Record<string, unknown>, token?: string) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body, token }),

  delete: <T>(endpoint: string, token?: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE', token }),

  upload: <T>(endpoint: string, formData: FormData, token?: string) =>
    apiFetch<T>(endpoint, { method: 'POST', body: formData, token }),
};
