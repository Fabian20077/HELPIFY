'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import { ticketsFromApiListData, type AdminMetrics, type MetricsData, type Ticket, type Category, type Department, type User } from '@/lib/types';
import { computeUrgencyScore } from '@/lib/urgency';

// Re-export for consumers who previously imported from here
export { computeUrgencyScore };

export function useMetrics() {
  const { token } = useAuth();

  const { data: metrics, isLoading: loading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.get<MetricsData>('/metrics', token ?? undefined),
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutos - métricas cambian poco
  });

  const queryClient = useQueryClient();
  const refetch = () => queryClient.invalidateQueries({ queryKey: ['metrics'] });

  return { 
    metrics: metrics ?? null, 
    loading, 
    error: error instanceof Error ? error.message : null, 
    refetch 
  };
}

export function useTickets(query: string = '') {
  const { token } = useAuth();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['tickets', query],
    queryFn: async () => {
      const res = await api.getPaginated<Ticket[]>(`/tickets?${query}`, token ?? undefined);
      return ticketsFromApiListData<Ticket>(res.data);
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1 minuto - tickets pueden cambiar frecuentemente
  });

  const queryClient = useQueryClient();
  const refetch = () => queryClient.invalidateQueries({ queryKey: ['tickets'] });

  return { 
    tickets: data ?? [], 
    loading, 
    error: error instanceof Error ? error.message : null, 
    refetch 
  };
}

export function useTicket(id: string) {
  const { token } = useAuth();

  const { data: ticket, isLoading: loading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get<Ticket>(`/tickets/${id}`, token ?? undefined),
    enabled: !!token && !!id,
    staleTime: 1000 * 30, // 30 segundos - detalle de ticket puede cambiar
  });

  return { 
    ticket: ticket ?? null, 
    loading, 
    error: error instanceof Error ? error.message : null 
  };
}

export function useCategories() {
  const { token } = useAuth();

  const { data: categories, isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories', token ?? undefined),
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutos - categorías cambian muy poco
  });

  return { categories: categories ?? [], loading };
}

export function useDepartments() {
  const { token } = useAuth();

  const { data: departments, isLoading: loading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Department[]>('/departments', token ?? undefined),
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutos - departamentos cambian muy poco
  });

  return { departments: departments ?? [], loading };
}

export function useUsers() {
  const { token } = useAuth();

  const { data: users, isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users', token ?? undefined),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutos - usuarios pueden cambiar
  });

  return { users: users ?? [], loading };
}
