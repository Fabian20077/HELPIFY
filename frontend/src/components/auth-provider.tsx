'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, removeToken } from '@/lib/auth';
import { api } from '@/lib/api';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setTokenState(storedToken);
    api.get<User>('/users/me', storedToken)
      .then(setUser)
      .catch(() => {
        removeToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
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
