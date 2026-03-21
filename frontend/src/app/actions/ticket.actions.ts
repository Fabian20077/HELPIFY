'use server';

import { api } from '@/lib/api';
import type { TicketFormValues } from '@/components/tickets/ticket-form';
import type { Ticket } from '@/lib/types';

export async function createTicketAction(data: TicketFormValues, token: string) {
  if (!token) throw new Error('No autenticado');

  const payload: Record<string, any> = { ...data };
  if (!payload.categoryId) delete payload.categoryId;

  console.log('[createTicketAction] Payload:', JSON.stringify(payload));
  console.log('[createTicketAction] Token length:', token.length);

  try {
    const result = await api.post<{ id: string }>('/tickets', payload, token);
    console.log('[createTicketAction] Success:', result);
    return result;
  } catch (error: any) {
    console.error('[createTicketAction] Error:', error.message, error.statusCode);
    throw error;
  }
}

export async function addCommentAction(ticketId: string, data: Record<string, any>, token: string) {
  if (!token) throw new Error('No autenticado');

  return api.post(`/tickets/${ticketId}/comments`, data, token);
}

export async function updateTicketStatusAction(ticketId: string, status: string, token: string): Promise<Ticket> {
  if (!token) throw new Error('No autenticado');

  return api.patch<Ticket>(`/tickets/${ticketId}/status`, { status }, token);
}
