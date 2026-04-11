'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApi } from '@/components/auth-provider';
import { ticketsFromApiListData, type Ticket, type TicketListSearchParams, TicketStatus, TicketPriority } from '@/lib/types';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { TicketCard } from '@/components/tickets/ticket-card';
import { ButterflyCard, GlassPanel } from '@/components/ui/butterfly-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Button } from '@/components/ui/button';
import { PlusIcon, InboxIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

function TicketsContent() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<{ prev?: number; next?: number; page: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const safeParams: TicketListSearchParams = {
    page: typeof searchParams.get('page') === 'string' ? searchParams.get('page') ?? '1' : '1',
    limit: typeof searchParams.get('limit') === 'string' ? searchParams.get('limit') ?? '10' : '10',
    status: typeof searchParams.get('status') === 'string' ? (searchParams.get('status') as TicketStatus) : undefined,
    priority: typeof searchParams.get('priority') === 'string' ? (searchParams.get('priority') as TicketPriority) : undefined,
    search: typeof searchParams.get('search') === 'string' ? searchParams.get('search') ?? undefined : undefined,
    departmentId: typeof searchParams.get('departmentId') === 'string' ? searchParams.get('departmentId') ?? undefined : undefined,
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
        setPagination(res.pagination ?? null);
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
          <h1 className="text-2xl font-display tracking-tight text-foreground">Tickets de Soporte</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y responde a los incidentes del sistema.
          </p>
        </div>
        <GradientButton variant="primary" size="lg">
          <Link href="/dashboard/tickets/new" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Nuevo Ticket
          </Link>
        </GradientButton>
      </div>

      <GlassPanel className="p-4">
        <TicketFilters />
      </GlassPanel>

      {tickets.length === 0 ? (
        <ButterflyCard variant="gradient" hover={false}>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 mb-4">
              <InboxIcon className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No se encontraron tickets</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Ajusta los filtros o crea un nuevo ticket para comenzar.
            </p>
            <GradientButton variant="secondary">
              <Link href="/dashboard/tickets/new">Crear Ticket</Link>
            </GradientButton>
          </div>
        </ButterflyCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <ButterflyCard variant="elevated" hover={false} className="flex items-center justify-center gap-3 py-4">
          {pagination.prev ? (
            <GradientButton variant="secondary" size="sm">
              <Link href={`?${new URLSearchParams({ ...safeParams, page: String(pagination.prev) } as Record<string, string>).toString()}`}>Anterior</Link>
            </GradientButton>
          ) : (
            <GradientButton variant="secondary" size="sm" disabled>Anterior</GradientButton>
          )}

          <span className="text-sm font-medium text-muted-foreground px-4">
            Página {pagination.page} de {pagination.pages}
          </span>

          {pagination.next ? (
            <GradientButton variant="secondary" size="sm">
              <Link href={`?${new URLSearchParams({ ...safeParams, page: String(pagination.next) } as Record<string, string>).toString()}`}>Siguiente</Link>
            </GradientButton>
          ) : (
            <GradientButton variant="secondary" size="sm" disabled>Siguiente</GradientButton>
          )}
        </ButterflyCard>
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
