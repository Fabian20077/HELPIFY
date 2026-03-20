'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import type { Ticket, MetricsData, AdminMetrics } from '@/lib/types';

function computeUrgencyScore(ticket: any): number {
  const history = ticket.history ?? [];
  const lastAgentActivity = history
    .filter((h: any) => h.changedBy !== ticket.createdById)
    .pop();

  const lastActivityTime = lastAgentActivity
    ? new Date(lastAgentActivity.changedAt)
    : new Date(ticket.createdAt);
  const hoursSinceResponse = (Date.now() - lastActivityTime.getTime()) / (1000 * 60 * 60);

  const previousReopenings = history.filter(
    (h: any) => h.fieldName === 'status' && h.oldValue === 'resolved' && h.newValue === 'in_progress'
  ).length;

  const hoursInWaiting =
    ticket.status === 'waiting'
      ? (() => {
          const lastTransition = history
            .filter((h: any) => h.fieldName === 'status' && h.newValue === 'waiting')
            .pop();
          return lastTransition
            ? (Date.now() - new Date(lastTransition.changedAt).getTime()) / (1000 * 60 * 60)
            : 0;
        })()
      : 0;

  const MAX_HOURS_NO_ACTIVITY = 24;
  const POINTS_PER_REOPEN = 10;
  const MAX_HOURS_WAITING = 48;

  const timeFactor = Math.min((hoursSinceResponse / MAX_HOURS_NO_ACTIVITY) * 35, 35);
  const reopenFactor = Math.min(previousReopenings * POINTS_PER_REOPEN, 25);
  const waitingFactor = Math.min((hoursInWaiting / MAX_HOURS_WAITING) * 20, 20);

  return Math.round(Math.min(timeFactor + reopenFactor + waitingFactor, 100));
}

export function useMetrics() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get<MetricsData>(`/metrics`, token);
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

export function useTickets(query: string = '') {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getPaginated<{ tickets: Ticket[] }>(`/tickets?${query}`, token);
      setTickets(res.data?.tickets ?? []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useTicket(id: string) {
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    api.get<Ticket>(`/tickets/${id}`, token)
      .then(setTicket)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  return { ticket, loading, error };
}

export function useCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get<any[]>('/categories', token)
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [token]);

  return { categories, loading };
}

export function useDepartments() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get<any[]>('/departments', token)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, [token]);

  return { departments, loading };
}

export function useUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get<any[]>('/users', token)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [token]);

  return { users, loading };
}
