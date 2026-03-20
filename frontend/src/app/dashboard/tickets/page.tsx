import { Suspense } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Ticket, TicketListSearchParams } from '@/lib/types';
import { getCurrentUser, getToken } from '@/lib/auth';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { TicketCard } from '@/components/tickets/ticket-card';
import { Button } from '@/components/ui/button';
import { PlusIcon, FileTextIcon, InboxIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getTickets(searchParams: TicketListSearchParams) {
  const token = await getToken();
  if (!token) return null;

  // Build query string
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) query.set(key, value as string);
  });

  try {
    const res = await api.getPaginated<{ tickets: Ticket[] }>(`/tickets?${query.toString()}`, token);
    return res;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return null;
  }
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const rawParams = await searchParams;
  const safeParams: TicketListSearchParams = {
    page: typeof rawParams.page === 'string' ? rawParams.page : '1',
    limit: typeof rawParams.limit === 'string' ? rawParams.limit : '10',
    status: typeof rawParams.status === 'string' ? rawParams.status as any : undefined,
    priority: typeof rawParams.priority === 'string' ? rawParams.priority as any : undefined,
    search: typeof rawParams.search === 'string' ? rawParams.search : undefined,
    departmentId: typeof rawParams.departmentId === 'string' ? rawParams.departmentId : undefined,
  };

  const response = await getTickets(safeParams);
  const tickets = Array.isArray(response?.data) ? response.data : [];
  const pagination = response?.pagination;

  return (
    <div className="flex-1 space-y-6 pt-4">
      {/* Header */}
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

      {/* Filters */}
      <div className="bg-card w-full border border-border/50 rounded-lg shadow-sm p-4">
        <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded-md" />}>
          <TicketFilters />
        </Suspense>
      </div>

      {/* Tickets Grid/List */}
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

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {pagination.prev ? (
            <Button 
              variant="outline" 
              nativeButton={false}
              render={<Link href={`?${new URLSearchParams({ ...safeParams, page: String(pagination.prev) }).toString()}`} />}
            >
              Anterior
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Anterior
            </Button>
          )}

          <span className="text-sm font-medium text-muted-foreground px-4">
            Página {pagination.page} de {pagination.pages}
          </span>
          
          {pagination.next ? (
            <Button 
              variant="outline" 
              nativeButton={false}
              render={<Link href={`?${new URLSearchParams({ ...safeParams, page: String(pagination.next) }).toString()}`} />}
            >
              Siguiente
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Siguiente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
