'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/auth-provider';
import { TicketDetail } from '@/components/tickets/ticket-detail';
import type { Ticket, UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function TicketDetailPage() {
  const params = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Key para forzar re-render cuando cambia el ID
  const id = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!token || !id) return;

    setLoading(true);
    setTicket(null); // Limpiar ticket anterior
    setError(null);

    api.get<Ticket>(`/tickets/${id}`)
      .then(setTicket)
      .catch((err: unknown) => {
        if (err instanceof Error && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
          setTicket(null);
        } else {
          setError(err instanceof Error ? err.message : 'Error al cargar ticket');
        }
      })
      .finally(() => setLoading(false));
  }, [id, user, token, authLoading]);

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
