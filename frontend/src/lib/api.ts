// ============================================================================
// Helpify — Type-safe API Client
// Wraps fetch with error handling matching backend response format.
// Server-side: reads token from cookie. Client-side: uses credentials.
// ============================================================================

import type { ApiResponse } from './types';

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

/**
 * Base del backend (debe incluir `/api`). Solo URLs absolutas https?://...
 * Si usas "/api" en Vercel, el navegador llama a tu propio dominio y obtienes HTML 404.
 */
function normalizePublicApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    return raw.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && raw.startsWith('/')) {
    console.error(
      '[Helpify] NEXT_PUBLIC_API_URL no puede ser una ruta relativa (ej. /api). ' +
        'En Vercel → Environment Variables usa la URL completa, p. ej. https://tu-app.up.railway.app/api',
    );
  }
  return 'http://localhost:3001/api';
}

export const API_BASE_URL = normalizePublicApiBaseUrl();

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

async function readApiResponse(response: Response): Promise<ApiResponse<unknown>> {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await response.text();
    const looksLikeHtml = /^\s*</.test(text);
    throw new ApiError(
      looksLikeHtml
        ? 'El servidor respondió con HTML (no JSON). Revisa NEXT_PUBLIC_API_URL en Vercel: debe ser la URL completa del backend en Railway, por ejemplo https://xxxx.up.railway.app/api'
        : text.slice(0, 200) || `Error ${response.status}`,
      response.status,
      'error',
    );
  }
  return response.json() as Promise<ApiResponse<unknown>>;
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  token?: string;
}

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
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    processedBody = JSON.stringify(body);
  }

  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    ...rest,
    headers,
    body: processedBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await readApiResponse(response);

  if (!response.ok) {
    throw new ApiError(
      (data.message as string) || `Error ${response.status}`,
      response.status,
      (data.status as string) || 'error',
    );
  }

  return data.data as T;
}

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

  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    ...rest,
    headers,
    body: processedBody,
  });

  if (response.status === 204) {
    return { status: 'success' } as ApiResponse<T>;
  }

  const data = await readApiResponse(response);

  if (!response.ok) {
    throw new ApiError(
      (data.message as string) || `Error ${response.status}`,
      response.status,
      (data.status as string) || 'error',
    );
  }

  return data as ApiResponse<T>;
}

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
