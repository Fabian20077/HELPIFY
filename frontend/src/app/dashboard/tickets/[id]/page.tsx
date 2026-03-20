import { api } from '@/lib/api';
import { Ticket, UserRole } from '@/lib/types';
import { getToken, getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { TicketDetail } from '@/components/tickets/ticket-detail';

export const dynamic = 'force-dynamic';

async function getTicketDetails(id: string) {
  const token = await getToken();
  if (!token) return null;

  try {
    const ticket = await api.get<Ticket>(`/tickets/${id}`, token);
    return ticket;
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const ticket = await getTicketDetails(id);

  if (!ticket) notFound();

  return <TicketDetail initialTicket={ticket} userRole={user.role as UserRole} />;
}
