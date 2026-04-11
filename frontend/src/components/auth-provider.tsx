'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, removeToken, isTokenExpiringSoon, setToken } from '@/lib/auth';
import { api, API_BASE_URL } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  logout: () => {},
});

/**
 * Attempt to refresh the access token using the httpOnly refresh token cookie.
 * Has a 3-second timeout to avoid blocking the app when backend is unavailable.
 */
async function refreshAccessToken(): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === 'success' && data.data?.token) {
      setToken(data.data.token);
      return data.data.token;
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial auth check
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const storedToken = getToken();

      if (!storedToken || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      setTokenState(storedToken);

      try {
        const userData = await api.get<User>('/users/me', storedToken);
        if (!cancelled) setUser(userData);
      } catch {
        // Token invalid - limpiar pero no bloquear
        if (!cancelled) {
          removeToken();
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => { cancelled = true; };
  }, []);

  // Auto-refresh: check token expiry every minute (solo si hay token válido)
  useEffect(() => {
    if (!token) return;

    let intervalCancelled = false;

    const interval = setInterval(async () => {
      if (intervalCancelled) return;
      if (isTokenExpiringSoon(token)) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken && !intervalCancelled) setTokenState(newToken);
        } catch {
          // Silenciar errores de refresh - no crítico
        }
      }
    }, 60 * 1000);

    return () => { intervalCancelled = true; clearInterval(interval); };
  }, [token]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors during logout
    }
    removeToken();
    setTokenState(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useToken() {
  const { token, loading } = useAuth();
  return { token, loading };
}

export function useApi() {
  const { token } = useAuth();
  return {
    get<T>(endpoint: string) { return api.get<T>(endpoint, token ?? undefined); },
    getPaginated<T>(endpoint: string) { return api.getPaginated<T>(endpoint, token ?? undefined); },
    post<T>(endpoint: string, body: Record<string, unknown>) { return api.post<T>(endpoint, body, token ?? undefined); },
    patch<T>(endpoint: string, body: Record<string, unknown>) { return api.patch<T>(endpoint, body, token ?? undefined); },
    delete<T>(endpoint: string) { return api.delete<T>(endpoint, token ?? undefined); },
    upload<T>(endpoint: string, formData: FormData) { return api.upload<T>(endpoint, formData, token ?? undefined); },
  };
}
