'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import { TicketStatus, UserRole } from '@/lib/types';
import {
  MetricsStatusCard,
  MetricsHighlightCard,
  RecentTicketRow,
  AgentLoadIndicator,
} from '@/components/dashboard/metrics-cards';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InboxIcon,
  ActivityIcon,
  BarChart3Icon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ──────────────────────────────────────────
   Urgency score helper
────────────────────────────────────────── */
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
    (h: any) => h.fieldName === 'status' && h.oldValue === 'resolved' && h.newValue === 'in_progress',
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

  const timeFactor = Math.min((hoursSinceResponse / 24) * 35, 35);
  const reopenFactor = Math.min(previousReopenings * 10, 25);
  const waitingFactor = Math.min((hoursInWaiting / 48) * 20, 20);
  return Math.round(Math.min(timeFactor + reopenFactor + waitingFactor, 100));
}

/* ──────────────────────────────────────────
   Sub-component: Section Header
────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon className="h-4 w-4 text-orange-500" />
      <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">{title}</h2>
    </div>
  );
}

/* ──────────────────────────────────────────
   Sub-component: Department Resolution Bars
────────────────────────────────────────── */
function DeptResolutionBars({ tickets }: { tickets: any[] }) {
  const stats = useMemo(() => {
    const depts: Record<string, { total: number; resolved: number }> = {};
    for (const t of tickets) {
      const dept = t.department?.name ?? t.departmentName ?? 'Sin dept.';
      if (!depts[dept]) depts[dept] = { total: 0, resolved: 0 };
      depts[dept].total += 1;
      if (t.status === TicketStatus.RESOLVED) depts[dept].resolved += 1;
    }
    return Object.entries(depts)
      .map(([name, { total, resolved }]) => ({
        name,
        pct: total > 0 ? Math.round((resolved / total) * 100) : 0,
        total,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [tickets]);

  if (stats.length === 0) {
    return <p className="text-sm text-slate-500 py-4">Sin datos de departamentos aún.</p>;
  }

  return (
    <div className="space-y-4">
      {stats.map((dept) => (
        <div key={dept.name}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-slate-300 truncate max-w-[160px]">{dept.name}</span>
            <span className="text-sm font-semibold text-white">{dept.pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
              style={{ width: `${dept.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   Empty state
───────────────────────────────────────── */

/* ──────────────────────────────────────────
   CUSTOMER DASHBOARD
────────────────────────────────────────── */
function CustomerDashboard({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/metrics', token).then(setMetrics).finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-800" />
        ))}
      </div>
    );
  if (!metrics) return null;

  const statuses = [
    { label: 'Abiertos', count: metrics.byStatus?.open ?? 0, status: TicketStatus.OPEN },
    { label: 'En Progreso', count: metrics.byStatus?.in_progress ?? 0, status: TicketStatus.IN_PROGRESS },
    { label: 'En Espera', count: metrics.byStatus?.waiting ?? 0, status: TicketStatus.WAITING },
    { label: 'Resueltos', count: metrics.byStatus?.resolved ?? 0, status: TicketStatus.RESOLVED },
  ];

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader icon={TicketIcon} title="Estado de mis tickets" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statuses.map((s) => (
            <MetricsStatusCard key={s.status} {...s} />
          ))}
        </div>
      </div>

      {metrics.recentTickets?.length > 0 ? (
        <div>
          <SectionHeader icon={ActivityIcon} title="Mis tickets recientes" />
          <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/50">
            {metrics.recentTickets.map((t: any) => (
              <RecentTicketRow key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          type="tickets"
          title="No hay tickets aún"
          description="No tienes tickets de soporte. Crea uno nuevo para comenzar."
          actionLabel="Crear mi primer ticket"
          onAction={() => {}}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   AGENT DASHBOARD
────────────────────────────────────────── */
function AgentDashboard({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/metrics', token).then(setMetrics).finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-800" />
        ))}
      </div>
    );
  if (!metrics) return null;

  const statuses = [
    { label: 'Abiertos', count: metrics.byStatus?.open ?? 0, status: TicketStatus.OPEN },
    { label: 'En Progreso', count: metrics.byStatus?.in_progress ?? 0, status: TicketStatus.IN_PROGRESS },
    { label: 'En Espera', count: metrics.byStatus?.waiting ?? 0, status: TicketStatus.WAITING },
    { label: 'Resueltos', count: metrics.byStatus?.resolved ?? 0, status: TicketStatus.RESOLVED },
  ];

  const sortedAssigned = (metrics.recentAssigned ?? [])
    .map((t: any) => ({ ...t, urgencyScore: computeUrgencyScore(t) }))
    .sort((a: any, b: any) => b.urgencyScore - a.urgencyScore);

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader icon={TicketIcon} title="Tickets en el sistema" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {statuses.map((s) => (
            <MetricsStatusCard key={s.status} {...s} />
          ))}
        </div>
        <MetricsHighlightCard label="Tickets asignados a mí" value={metrics.totalAssigned ?? 0} variant="highlight" />
      </div>

      {sortedAssigned.length > 0 ? (
        <div>
          <SectionHeader icon={ActivityIcon} title="Cola de prioridad — Mis tickets" />
          <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/50">
            {sortedAssigned.map((t: any) => (
              <RecentTicketRow key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          type="tickets"
          title="Todo al día"
          description="No tienes tickets asignados en este momento."
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   ADMIN DASHBOARD
────────────────────────────────────────── */
function AdminDashboard({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>('/metrics', token),
      api.get<any[]>('/tickets?assignedToId=unassigned', token).catch(() => []),
      api.get<any[]>('/tickets', token).catch(() => []),
    ])
      .then(([m, unassignedData, allData]) => {
        setMetrics(m);
        setUnassigned(unassignedData ?? []);
        setAllTickets(allData ?? []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-800" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-800" />
      </div>
    );
  if (!metrics) return null;

  // Resolved percentage for the KPI
  const totalTickets =
    (metrics.byStatus?.open ?? 0) +
    (metrics.byStatus?.in_progress ?? 0) +
    (metrics.byStatus?.waiting ?? 0) +
    (metrics.byStatus?.resolved ?? 0);
  const resolvedPct =
    totalTickets > 0 ? Math.round(((metrics.resolvedCount ?? 0) / totalTickets) * 100) : 0;

  const topUnassigned = unassigned
    .map((t) => ({ ...t, urgencyScore: computeUrgencyScore(t) }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 5);

  // Recent activity (last 5 resolved/in_progress tickets from all tickets)
  const recentActivity = [...allTickets]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ── KPI Row ── */}
      <div>
        <SectionHeader icon={TicketIcon} title="Resumen del sistema" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricsStatusCard
            label="Tickets Abiertos"
            count={metrics.byStatus?.open ?? 0}
            status={TicketStatus.OPEN}
            trend={{ value: '+2%', up: true }}
          />
          <MetricsStatusCard
            label="En Progreso"
            count={metrics.byStatus?.in_progress ?? 0}
            status={TicketStatus.IN_PROGRESS}
          />
          <MetricsStatusCard
            label="En Espera"
            count={metrics.byStatus?.waiting ?? 0}
            status={TicketStatus.WAITING}
          />
          <MetricsStatusCard
            label="Resueltos"
            count={metrics.resolvedCount ?? 0}
            status={TicketStatus.RESOLVED}
            trend={{ value: `${resolvedPct}%`, up: true }}
          />
        </div>
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-3 gap-4">
        <MetricsHighlightCard
          label="Sin asignar"
          value={metrics.unassigned ?? 0}
          variant={metrics.unassigned > 0 ? 'danger' : 'highlight'}
        />
        <MetricsHighlightCard
          label="Tiempo promedio"
          value={Math.round(metrics.avgResolutionHours ?? 0)}
          sublabel="hrs"
          variant="highlight"
        />
        <MetricsHighlightCard
          label="Tasa de resolución"
          value={resolvedPct}
          sublabel="%"
          variant="highlight"
        />
      </div>

      {/* ── Two-column section: Recent Activity + Dept Resolution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3">
          <SectionHeader icon={ActivityIcon} title="Actividad Reciente" />
          {recentActivity.length > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/50">
              {recentActivity.map((t: any) => (
                <RecentTicketRow key={t.id} ticket={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="default"
              title="Sin actividad reciente"
              description="Los tickets actualizados aparecerán aquí."
            />
          )}
        </div>

        {/* Resolution by Dept */}
        <div className="lg:col-span-2">
          <SectionHeader icon={BarChart3Icon} title="Resolución por Depto." />
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <DeptResolutionBars tickets={allTickets} />
            {allTickets.length > 0 && (
              <p className="mt-5 text-[11px] text-slate-500 leading-snug border-t border-slate-800 pt-4">
                Eficiencia basada en tickets resueltos vs. total por departamento.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Priority Queue ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
              Cola de Prioridad
            </h2>
          </div>
          <a href="/dashboard/tickets" className="text-xs text-orange-500 hover:text-orange-400 transition-colors font-medium">
            Ver todos →
          </a>
        </div>

        {topUnassigned.length > 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/50">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-slate-800/50 text-[11px] font-semibold text-slate-500 tracking-widest uppercase">
              <span>Ticket</span>
              <span>Estado</span>
              <span>Urgencia</span>
            </div>
            {topUnassigned.map((t: any) => (
              <RecentTicketRow key={t.id} ticket={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            type="default"
            title="¡Todo asignado!"
            description="No hay tickets pendientes de asignación. Buen trabajo."
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   PAGE ENTRY POINT
────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, token } = useAuth();

  if (!user || !token) return null;

  return (
    <div className="space-y-8 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bienvenido de vuelta,{' '}
            <span className="font-semibold text-slate-200">{user.name}</span>
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          En vivo
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-800" />
            ))}
          </div>
        }
      >
        {user.role === UserRole.CUSTOMER && <CustomerDashboard token={token} />}
        {user.role === UserRole.AGENT && <AgentDashboard token={token} />}
        {user.role === UserRole.ADMIN && <AdminDashboard token={token} />}
      </Suspense>
    </div>
  );
}
