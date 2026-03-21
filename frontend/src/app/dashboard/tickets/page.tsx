'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApi } from '@/components/auth-provider';
import { ticketsFromApiListData, type Ticket, type TicketListSearchParams } from '@/lib/types';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { TicketCard } from '@/components/tickets/ticket-card';
import { Button } from '@/components/ui/button';
import { PlusIcon, InboxIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

function TicketsContent() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const safeParams: TicketListSearchParams = {
    page: typeof searchParams.get('page') === 'string' ? searchParams.get('page') as string : '1',
    limit: typeof searchParams.get('limit') === 'string' ? searchParams.get('limit') as string : '10',
    status: typeof searchParams.get('status') === 'string' ? searchParams.get('status') as any : undefined,
    priority: typeof searchParams.get('priority') === 'string' ? searchParams.get('priority') as any : undefined,
    search: typeof searchParams.get('search') === 'string' ? searchParams.get('search') as string : undefined,
    departmentId: typeof searchParams.get('departmentId') === 'string' ? searchParams.get('departmentId') as string : undefined,
  };

  useEffect(() => {
    const query = new URLSearchParams();
    Object.entries(safeParams).forEach(([key, value]) => {
      if (value) query.set(key, value as string);
    });

    setLoading(true);
    api.getPaginated<Ticket[]>(`/tickets?${query.toString()}`)
      .then((res) => {
        setTickets(ticketsFromApiListData<Ticket>(res.data));
        setPagination(res.pagination);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [searchParams.toString()]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
        <div className="h-64 animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y responde a los incidentes del sistema.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/tickets/new" />} className="shrink-0 gap-2">
          <PlusIcon className="h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      <div className="bg-card w-full border border-border/50 rounded-lg shadow-sm p-4">
        <TicketFilters />
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-card/50">
          <div className="bg-muted p-4 rounded-full mb-4">
            <InboxIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No se encontraron tickets</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Ajusta los filtros o crea un nuevo ticket para comenzar.
          </p>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/tickets/new" />}>
            Crear Ticket
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {pagination.prev ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`?${new URLSearchParams({ ...safeParams as any, page: String(pagination.prev) }).toString()}`} />}
            >
              Anterior
            </Button>
          ) : (
            <Button variant="outline" disabled>Anterior</Button>
          )}

          <span className="text-sm font-medium text-muted-foreground px-4">
            Página {pagination.page} de {pagination.pages}
          </span>

          {pagination.next ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`?${new URLSearchParams({ ...safeParams as any, page: String(pagination.next) }).toString()}`} />}
            >
              Siguiente
            </Button>
          ) : (
            <Button variant="outline" disabled>Siguiente</Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
      <TicketsContent />
    </Suspense>
  );
}
