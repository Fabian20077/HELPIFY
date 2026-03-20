import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getCurrentUser, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { TicketStatus, UserRole, TicketPriority } from '@/lib/types';
import { MetricsStatusCard, MetricsHighlightCard, RecentTicketRow } from '@/components/dashboard/metrics-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TicketIcon,
  AlertCircleIcon,
  ClockIcon,
  UserXIcon,
  CheckCircleIcon,
  InboxIcon,
} from 'lucide-react';
import type { MetricsData, AdminMetrics } from '@/lib/types';
import { redirect } from 'next/navigation';

function getUrgencyColor(score: number): string {
  if (score <= 25) return 'bg-green-500';
  if (score <= 50) return 'bg-yellow-500';
  if (score <= 75) return 'bg-orange-500';
  return 'bg-red-500';
}

function getUrgencyLabel(score: number): string {
  if (score <= 25) return 'Baja';
  if (score <= 50) return 'Media';
  if (score <= 75) return 'Alta';
  return 'Crítica';
}

async function getUnassignedTickets(token: string) {
  try {
    const tickets = await api.get<any[]>(`/tickets?assignedToId=unassigned`, token);
    return tickets ?? [];
  } catch {
    return [];
  }
}

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

async function CustomerDashboard({ token }: { token: string }) {
  const metrics = await api.get<MetricsData>(`/metrics`, token);
  if (!metrics) return null;

  const m = metrics as any;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Estado de mis tickets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricsStatusCard label="Abiertos" count={m.byStatus.open} status={TicketStatus.OPEN} />
          <MetricsStatusCard label="En Progreso" count={m.byStatus.in_progress} status={TicketStatus.IN_PROGRESS} />
          <MetricsStatusCard label="En Espera" count={m.byStatus.waiting} status={TicketStatus.WAITING} />
          <MetricsStatusCard label="Resueltos" count={m.byStatus.resolved} status={TicketStatus.RESOLVED} />
        </div>
      </div>

      {m.recentTickets && m.recentTickets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Mis tickets recientes</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {m.recentTickets.map((ticket: any) => (
                <RecentTicketRow key={ticket.id} ticket={ticket} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {(!m.recentTickets || m.recentTickets.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-card/50">
          <div className="bg-muted p-4 rounded-full mb-4">
            <InboxIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sin tickets aún</h3>
          <p className="text-muted-foreground max-w-sm">
            No tienes tickets de soporte. Crea uno nuevo para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}

async function AgentDashboard({ token }: { token: string }) {
  const metrics = await api.get<MetricsData>(`/metrics`, token);
  if (!metrics) return null;

  const m = metrics as any;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Tickets en el sistema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <MetricsStatusCard label="Abiertos" count={m.byStatus.open} status={TicketStatus.OPEN} />
          <MetricsStatusCard label="En Progreso" count={m.byStatus.in_progress} status={TicketStatus.IN_PROGRESS} />
          <MetricsStatusCard label="En Espera" count={m.byStatus.waiting} status={TicketStatus.WAITING} />
          <MetricsStatusCard label="Resueltos" count={m.byStatus.resolved} status={TicketStatus.RESOLVED} />
        </div>
        <MetricsHighlightCard
          label="Tickets asignados a mí"
          value={m.totalAssigned}
          variant="highlight"
        />
      </div>

      {m.recentAssigned && m.recentAssigned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Mis tickets asignados</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {m.recentAssigned
                .sort((a: any, b: any) => b.urgencyScore - a.urgencyScore)
                .map((ticket: any) => (
                  <RecentTicketRow key={ticket.id} ticket={ticket} />
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

async function AdminDashboard({ token }: { token: string }) {
  const [metrics, unassignedTickets] = await Promise.all([
    api.get<MetricsData>(`/metrics`, token),
    getUnassignedTickets(token),
  ]);

  if (!metrics) return null;

  const m = metrics as AdminMetrics;

  const unassignedWithScore = unassignedTickets.map((t: any) => ({
    ...t,
    urgencyScore: computeUrgencyScore(t),
  }));

  const topUnassigned = unassignedWithScore
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 5)
    .map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      urgencyScore: t.urgencyScore,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Tickets en el sistema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <MetricsStatusCard label="Abiertos" count={m.byStatus.open} status={TicketStatus.OPEN} />
          <MetricsStatusCard label="En Progreso" count={m.byStatus.in_progress} status={TicketStatus.IN_PROGRESS} />
          <MetricsStatusCard label="En Espera" count={m.byStatus.waiting} status={TicketStatus.WAITING} />
          <MetricsStatusCard label="Resueltos" count={m.byStatus.resolved} status={TicketStatus.RESOLVED} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricsHighlightCard
            label="Tickets sin asignar"
            value={m.unassigned}
            variant={m.unassigned > 0 ? 'danger' : 'highlight'}
          />
          <MetricsHighlightCard
            label="Tiempo promedio"
            value={m.avgResolutionHours}
            sublabel="hrs"
            variant="highlight"
          />
          <MetricsHighlightCard
            label="Resueltos"
            value={m.resolvedCount}
            variant="highlight"
          />
        </div>
      </div>

      {topUnassigned.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tickets sin asignar — mayor urgencia</h2>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {topUnassigned.map((ticket: any) => (
                <RecentTicketRow key={ticket.id} ticket={ticket} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {topUnassigned.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-card/50">
          <div className="bg-muted p-4 rounded-full mb-4">
            <CheckCircleIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Todos los tickets están asignados</h3>
          <p className="text-muted-foreground max-w-sm">
            No hay tickets pendientes de asignación. ¡Buen trabajo!
          </p>
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const token = await getToken();

  if (!user || !token) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenido, {user.name}
        </p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
        {user.role === UserRole.CUSTOMER && <CustomerDashboard token={token} />}
        {user.role === UserRole.AGENT && <AgentDashboard token={token} />}
        {user.role === UserRole.ADMIN && <AdminDashboard token={token} />}
      </Suspense>
    </div>
  );
}
