'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/auth-provider';
import { TicketDetail } from '@/components/tickets/ticket-detail';
import type { Ticket, UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function TicketDetailPage() {
  const params = useParams();
  const { user, token } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    if (!user && !loading) {
      router.replace('/login');
      return;
    }
    if (!token || !id) return;

    setLoading(true);
    api.get<Ticket>(`/tickets/${id}`)
      .then(setTicket)
      .catch((err: any) => {
        if (err.statusCode === 404) {
          setTicket(null);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [user, token, id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
        <div className="h-96 animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-muted-foreground">Ticket no encontrado</p>
      </div>
    );
  }

  return <TicketDetail initialTicket={ticket} userRole={user!.role as UserRole} />;
}
