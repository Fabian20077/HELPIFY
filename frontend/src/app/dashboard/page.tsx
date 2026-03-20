'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import { TicketStatus, UserRole } from '@/lib/types';
import { MetricsStatusCard, MetricsHighlightCard, RecentTicketRow } from '@/components/dashboard/metrics-cards';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircleIcon,
  InboxIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function getUrgencyColor(score: number): string {
  if (score <= 25) return 'bg-green-500';
  if (score <= 50) return 'bg-yellow-500';
  if (score <= 75) return 'bg-orange-500';
  return 'bg-red-500';
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

function CustomerDashboard({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>(`/metrics`, token)
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="h-64 animate-pulse bg-muted rounded-xl" />;
  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Estado de mis tickets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricsStatusCard label="Abiertos" count={metrics.byStatus?.open ?? 0} status={TicketStatus.OPEN} />
          <MetricsStatusCard label="En Progreso" count={metrics.byStatus?.in_progress ?? 0} status={TicketStatus.IN_PROGRESS} />
          <MetricsStatusCard label="En Espera" count={metrics.byStatus?.waiting ?? 0} status={TicketStatus.WAITING} />
          <MetricsStatusCard label="Resueltos" count={metrics.byStatus?.resolved ?? 0} status={TicketStatus.RESOLVED} />
        </div>
      </div>

      {metrics.recentTickets && metrics.recentTickets.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Mis tickets recientes</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {metrics.recentTickets.map((ticket: any) => (
                <RecentTicketRow key={ticket.id} ticket={ticket} />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
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

function AgentDashboard({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>(`/metrics`, token)
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="h-64 animate-pulse bg-muted rounded-xl" />;
  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Tickets en el sistema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <MetricsStatusCard label="Abiertos" count={metrics.byStatus?.open ?? 0} status={TicketStatus.OPEN} />
          <MetricsStatusCard label="En Progreso" count={metrics.byStatus?.in_progress ?? 0} status={TicketStatus.IN_PROGRESS} />
          <MetricsStatusCard label="En Espera" count={metrics.byStatus?.waiting ?? 0} status={TicketStatus.WAITING} />
          <MetricsStatusCard label="Resueltos" count={metrics.byStatus?.resolved ?? 0} status={TicketStatus.RESOLVED} />
        </div>
        <MetricsHighlightCard label="Tickets asignados a mí" value={metrics.totalAssigned ?? 0} variant="highlight" />
      </div>

      {metrics.recentAssigned && metrics.recentAssigned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Mis tickets asignados</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {metrics.recentAssigned
                .sort((a: any, b: any) => {
                  const scoreA = computeUrgencyScore(a);
                  const scoreB = computeUrgencyScore(b);
                  return scoreB - scoreA;
                })
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

function AdminDashboard({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/metrics`, token),
      api.get<any[]>(`/tickets?assignedToId=unassigned`, token).catch(() => []),
    ]).then(([m, unassignedData]) => {
      setMetrics(m);
      setUnassigned(unassignedData ?? []);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="h-64 animate-pulse bg-muted rounded-xl" />;
  if (!metrics) return null;

  const topUnassigned = unassigned
    .map((t: any) => ({ ...t, urgencyScore: computeUrgencyScore(t) }))
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
          <MetricsStatusCard label="Abiertos" count={metrics.byStatus?.open ?? 0} status={TicketStatus.OPEN} />
          <MetricsStatusCard label="En Progreso" count={metrics.byStatus?.in_progress ?? 0} status={TicketStatus.IN_PROGRESS} />
          <MetricsStatusCard label="En Espera" count={metrics.byStatus?.waiting ?? 0} status={TicketStatus.WAITING} />
          <MetricsStatusCard label="Resueltos" count={metrics.byStatus?.resolved ?? 0} status={TicketStatus.RESOLVED} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricsHighlightCard label="Tickets sin asignar" value={metrics.unassigned ?? 0} variant={metrics.unassigned > 0 ? 'danger' : 'highlight'} />
          <MetricsHighlightCard label="Tiempo promedio" value={metrics.avgResolutionHours ?? 0} sublabel="hrs" variant="highlight" />
          <MetricsHighlightCard label="Resueltos" value={metrics.resolvedCount ?? 0} variant="highlight" />
        </div>
      </div>

      {topUnassigned.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Tickets sin asignar — mayor urgencia</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {topUnassigned.map((ticket: any) => (
                <RecentTicketRow key={ticket.id} ticket={ticket} />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
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

export default function DashboardPage() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return null;
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
