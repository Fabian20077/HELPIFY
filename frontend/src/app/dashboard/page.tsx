'use client';

import { Suspense } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useMetrics, useTickets } from '@/components/use-data';
import { UserRole } from '@/lib/types';
import { ButterflyCard, MetricCard, GlassPanel } from '@/components/ui/butterfly-card';
import { AnimatedBadge } from '@/components/ui/animated-badge';
import { Sparkline } from '@/components/ui/sparkline';
import { GradientButton } from '@/components/ui/gradient-button';
import { SectionHeader } from '@/components/ui/section-header';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  Ticket,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3,
  ArrowRight,
  Plus,
  List,
  TrendingUp,
  Timer,
  Activity,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ──────────────────────────────────────────
   LOADING SKELETON
────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface/50" />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   STATUS BADGE
────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
    open: { label: 'Abierto', variant: 'info' },
    in_progress: { label: 'En progreso', variant: 'default' },
    waiting: { label: 'Espera', variant: 'warning' },
    resolved: { label: 'Resuelto', variant: 'success' },
    closed: { label: 'Cerrado', variant: 'default' },
  };
  const s = map[status] || map.closed;
  return <AnimatedBadge variant={s.variant}>{s.label}</AnimatedBadge>;
}

/* ──────────────────────────────────────────
   TICKET ROW (for recent tickets list)
────────────────────────────────────────── */
function TicketRow({ ticket }: { ticket: any }) {
  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className="group flex items-center justify-between rounded-xl p-4 transition-all hover:bg-surface-hover border border-transparent hover:border-brand/20"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-brand transition-colors">
          {ticket.title}
        </p>
        <p className="text-xs text-foreground-subtle mt-1 font-mono">{ticket.id.slice(0, 8)}</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={ticket.status} />
        <div className="h-6 w-6 rounded-lg bg-brand/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-3 w-3 text-brand" />
        </div>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────
   CUSTOMER DASHBOARD
────────────────────────────────────────── */
function CustomerDashboard() {
  const { metrics, loading } = useMetrics();
  const shouldReduceMotion = useReducedMotion();

  if (loading) return <LoadingSkeleton />;
  if (!metrics) return null;

  // Fake sparkline data for demo
  const sparkData = [3, 5, 2, 8, 4, 7, 5, 9, 6, 8];

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        title="Mis Tickets"
        description="Tus solicitudes de soporte"
        icon={Ticket}
        action={
          <GradientButton variant="primary" size="md">
            <Plus className="h-4 w-4" />
            <Link href="/dashboard/tickets/new">Nuevo Ticket</Link>
          </GradientButton>
        }
      />

      {/* Metrics Grid - Asymmetric Bento */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Abiertos"
          value={(metrics as any).byStatus?.open ?? 0}
          icon={List}
          accent="text-sky-400"
          trend={{ value: '+2', up: true }}
        />
        <MetricCard
          label="En Progreso"
          value={(metrics as any).byStatus?.in_progress ?? 0}
          icon={Zap}
          accent="text-brand"
        />
        <MetricCard
          label="En Espera"
          value={(metrics as any).byStatus?.waiting ?? 0}
          icon={Clock}
          accent="text-warning"
        />
        <MetricCard
          label="Resueltos"
          value={(metrics as any).byStatus?.resolved ?? 0}
          icon={CheckCircle}
          accent="text-success"
          trend={{ value: '+12%', up: true }}
        />
      </div>

      {/* Activity Chart + Recent Tickets */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Activity Chart */}
        <ButterflyCard variant="gradient" hover={false} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
                <Activity className="h-4 w-4 text-brand" />
              </div>
              <span className="text-sm font-semibold text-foreground">Actividad Reciente</span>
            </div>
            <AnimatedBadge variant="default" pulse>En vivo</AnimatedBadge>
          </div>
          <div className="h-48">
            <Sparkline data={sparkData} height={180} />
          </div>
        </ButterflyCard>

        {/* Quick Stats */}
        <div className="space-y-4">
          <ButterflyCard variant="elevated" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <Timer className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-foreground-subtle uppercase tracking-wider">Tiempo Promedio</p>
                <p className="font-display text-2xl text-foreground mt-1">
                  {Math.round((metrics as any).avgResolutionHours ?? 0)}<span className="text-sm text-foreground-muted">h</span>
                </p>
              </div>
            </div>
          </ButterflyCard>
          <ButterflyCard variant="elevated" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <TrendingUp className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-foreground-subtle uppercase tracking-wider">Tasa Resolución</p>
                <p className="font-display text-2xl text-foreground mt-1">87%</p>
              </div>
            </div>
          </ButterflyCard>
        </div>
      </div>

      {/* Recent Tickets */}
      <ButterflyCard variant="gradient" hover={false}>
        <SectionHeader
          title="Tickets Recientes"
          icon={BarChart3}
          action={
            <Link href="/dashboard/tickets" className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        <div className="mt-4 space-y-1">
          {(metrics as any).recentTickets?.slice(0, 5).map((t: any) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      </ButterflyCard>
    </div>
  );
}

/* ──────────────────────────────────────────
   AGENT DASHBOARD
────────────────────────────────────────── */
function AgentDashboard() {
  const { metrics, loading } = useMetrics();

  if (loading) return <LoadingSkeleton />;
  if (!metrics) return null;

  const sparkData = [5, 3, 7, 4, 8, 6, 9, 5, 7, 8];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Panel de Agente"
        description="Tickets asignados"
        icon={Users}
        action={
          <div className="flex items-center gap-2 rounded-xl bg-surface border border-brand/20 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-foreground-muted">En línea</span>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Abiertos" value={(metrics as any).byStatus?.open ?? 0} icon={List} accent="text-sky-400" />
        <MetricCard label="En Progreso" value={(metrics as any).byStatus?.in_progress ?? 0} icon={Zap} accent="text-brand" />
        <MetricCard label="En Espera" value={(metrics as any).byStatus?.waiting ?? 0} icon={Clock} accent="text-warning" />
        <MetricCard label="Resueltos" value={(metrics as any).byStatus?.resolved ?? 0} icon={CheckCircle} accent="text-success" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <ButterflyCard variant="gradient" hover={false} className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
              <Activity className="h-4 w-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-foreground">Actividad</span>
          </div>
          <div className="h-48">
            <Sparkline data={sparkData} height={180} />
          </div>
        </ButterflyCard>

        <ButterflyCard variant="elevated" hover={false}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
              <Users className="h-4 w-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-foreground">Asignados</span>
          </div>
          <p className="font-display text-5xl text-foreground">{(metrics as any).totalAssigned ?? 0}</p>
        </ButterflyCard>
      </div>

      <ButterflyCard variant="gradient" hover={false}>
        <SectionHeader title="Asignados Recientemente" icon={List} />
        <div className="mt-4 space-y-1">
          {(metrics as any).recentAssigned?.slice(0, 5).map((t: any) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      </ButterflyCard>
    </div>
  );
}

/* ──────────────────────────────────────────
   ADMIN DASHBOARD
────────────────────────────────────────── */
function AdminDashboard() {
  const { metrics, loading: metricsLoading } = useMetrics();
  const { tickets: unassigned, loading: unassignedLoading } = useTickets('assignedToId=unassigned');

  const loading = metricsLoading || unassignedLoading;

  if (loading) return <LoadingSkeleton />;
  if (!metrics) return null;

  const total = ((metrics as any).byStatus?.open ?? 0) + ((metrics as any).byStatus?.in_progress ?? 0) + ((metrics as any).byStatus?.waiting ?? 0) + ((metrics as any).byStatus?.resolved ?? 0);
  const resolvedPct = total > 0 ? Math.round((((metrics as any).resolvedCount ?? 0) / total) * 100) : 0;

  const sparkData = [12, 8, 15, 10, 18, 14, 20, 16, 22, 19];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin Dashboard"
        description="Vista general del sistema"
        icon={BarChart3}
        action={
          <div className="flex items-center gap-2 rounded-xl bg-surface border border-brand/20 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-foreground-muted">En vivo</span>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Abiertos" value={(metrics as any).byStatus?.open ?? 0} icon={List} accent="text-sky-400" trend={{ value: '+2%', up: true }} />
        <MetricCard label="En Progreso" value={(metrics as any).byStatus?.in_progress ?? 0} icon={Zap} accent="text-brand" />
        <MetricCard label="Sin Asignar" value={(metrics as any).unassigned ?? 0} icon={AlertTriangle} accent={(metrics as any).unassigned > 0 ? 'text-danger' : 'text-success'} />
        <MetricCard label="Resolución" value={`${resolvedPct}%`} icon={TrendingUp} accent="text-success" />
      </div>

      {/* Chart + Stats */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <ButterflyCard variant="gradient" hover={false} className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
              <Activity className="h-4 w-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-foreground">Tendencia de Tickets</span>
          </div>
          <div className="h-48">
            <Sparkline data={sparkData} height={180} />
          </div>
        </ButterflyCard>

        <div className="space-y-4">
          <ButterflyCard variant="elevated" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <Timer className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-foreground-subtle uppercase tracking-wider">Tiempo Promedio</p>
                <p className="font-display text-2xl text-foreground mt-1">
                  {Math.round((metrics as any).avgResolutionHours ?? 0)}<span className="text-sm text-foreground-muted">h</span>
                </p>
              </div>
            </div>
          </ButterflyCard>
          <ButterflyCard variant="elevated" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-foreground-subtle uppercase tracking-wider">Resueltos</p>
                <p className="font-display text-2xl text-foreground mt-1">{(metrics as any).resolvedCount ?? 0}</p>
              </div>
            </div>
          </ButterflyCard>
          <ButterflyCard variant="elevated" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-foreground-subtle uppercase tracking-wider">Total</p>
                <p className="font-display text-2xl text-foreground mt-1">{total}</p>
              </div>
            </div>
          </ButterflyCard>
        </div>
      </div>

      {/* Priority Queue */}
      <ButterflyCard variant="gradient" hover={false}>
        <SectionHeader
          title="Cola de Prioridad"
          icon={AlertTriangle}
          action={
            <Link href="/dashboard/tickets" className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        {unassigned.length > 0 ? (
          <div className="mt-4 space-y-1">
            {unassigned.slice(0, 8).map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">¡Todo asignado!</p>
            <p className="text-xs text-foreground-muted mt-1">No hay tickets pendientes de asignación</p>
          </div>
        )}
      </ButterflyCard>
    </div>
  );
}

/* ──────────────────────────────────────────
   PAGE
────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {user.role === UserRole.CUSTOMER && <CustomerDashboard />}
      {user.role === UserRole.AGENT && <AgentDashboard />}
      {user.role === UserRole.ADMIN && <AdminDashboard />}
    </Suspense>
  );
}
