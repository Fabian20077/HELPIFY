'use server';

import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { TicketFormValues } from '@/components/tickets/ticket-form';
import type { Ticket } from '@/lib/types';

export async function createTicketAction(data: TicketFormValues) {
  const token = await getToken();
  if (!token) throw new Error('No autenticado');

  const payload: Record<string, any> = { ...data };
  if (!payload.categoryId) delete payload.categoryId;

  return api.post<{ id: string }>('/tickets', payload, token);
}

export async function addCommentAction(ticketId: string, data: Record<string, any>) {
  const token = await getToken();
  if (!token) throw new Error('No autenticado');

  return api.post(`/tickets/${ticketId}/comments`, data, token);
}

export async function updateTicketStatusAction(ticketId: string, status: string): Promise<Ticket> {
  const token = await getToken();
  if (!token) throw new Error('No autenticado');

  return api.patch<Ticket>(`/tickets/${ticketId}/status`, { status }, token);
}
