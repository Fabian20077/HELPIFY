'use client';

import Link from 'next/link';
import { TicketStatus } from '@/lib/types';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TicketIcon,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  [TicketStatus.OPEN]: {
    label: 'Abierto',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-400',
  },
  [TicketStatus.IN_PROGRESS]: {
    label: 'En Progreso',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
  },
  [TicketStatus.WAITING]: {
    label: 'En Espera',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    dot: 'bg-yellow-400',
  },
  [TicketStatus.RESOLVED]: {
    label: 'Resuelto',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  [TicketStatus.CLOSED]: {
    label: 'Cerrado',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-400',
  },
};

const STATUS_ICON: Record<TicketStatus, React.ElementType> = {
  [TicketStatus.OPEN]: TicketIcon,
  [TicketStatus.IN_PROGRESS]: ClockIcon,
  [TicketStatus.WAITING]: AlertTriangleIcon,
  [TicketStatus.RESOLVED]: CheckCircleIcon,
  [TicketStatus.CLOSED]: CheckCircleIcon,
};

function getUrgencyColor(score: number): string {
  if (score < 30) return 'text-green-400';
  if (score < 60) return 'text-yellow-400';
  return 'text-orange-500';
}

function getUrgencyGradient(score: number): string {
  if (score < 30) return 'from-green-500 to-emerald-600';
  if (score < 60) return 'from-yellow-500 to-amber-600';
  return 'from-orange-500 to-red-600';
}

function getUrgencyBg(score: number): string {
  if (score < 30) return 'bg-green-500/10';
  if (score < 60) return 'bg-yellow-500/10';
  return 'bg-orange-500/10';
}

export function UrgencyBadge({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const color = getUrgencyColor(score);
  const gradient = getUrgencyGradient(score);
  const bgClass = getUrgencyBg(score);
  const circumference = 2 * Math.PI * 12;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const label = score < 30 ? 'Bajo' : score < 60 ? 'Medio' : 'Alto';

  const fromColor = gradient.split(' ')[0].replace('from-', '');
  const toColor = gradient.split(' ')[1].replace('to-', '');

  return (
    <div className={`flex items-center gap-2 rounded-full px-2.5 py-1 ${bgClass}`}>
      <div className="relative h-8 w-8">
        <svg className="h-8 w-8 -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700" />
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke={`url(#gradient-${score})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="urgency-ring"
          />
          <defs>
            <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fromColor} />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          </defs>
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono ${color}`}>
          {score}
        </span>
      </div>
      {showLabel && <span className={`text-[10px] font-medium ${color}`}>{label}</span>}
    </div>
  );
}

export function AgentLoadIndicator({ count }: { count: number }) {
  const maxLoad = 10;
  const percentage = Math.min((count / maxLoad) * 100, 100);
  let color = 'bg-emerald-500';
  if (count >= 8) color = 'bg-red-500';
  else if (count >= 5) color = 'bg-orange-500';

  return (
    <div className="mt-1">
      <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 font-mono">{count} tickets</span>
    </div>
  );
}

interface MetricsStatusCardProps {
  label: string;
  count: number;
  status: TicketStatus;
  trend?: { value: string; up: boolean };
}

export function MetricsStatusCard({ label, count, status, trend }: MetricsStatusCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = STATUS_ICON[status];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/50">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bg}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trend.up ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend.up ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight">{count}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.dot} opacity-40`} />
    </div>
  );
}

interface MetricsHighlightCardProps {
  label: string;
  value: number;
  sublabel?: string;
  variant: 'highlight' | 'danger';
}

export function MetricsHighlightCard({ label, value, sublabel, variant }: MetricsHighlightCardProps) {
  const isDanger = variant === 'danger' && value > 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 transition-all ${isDanger ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50' : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50'}`}>
      <p className={`text-3xl font-extrabold tracking-tight ${isDanger ? 'text-red-400' : 'text-white'}`}>
        {value}
        {sublabel && <span className="ml-1 text-lg font-semibold text-slate-500">{sublabel}</span>}
      </p>
      <p className={`mt-1 text-sm ${isDanger ? 'text-red-300/70' : 'text-slate-400'}`}>{label}</p>
      {isDanger && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 opacity-40" />}
    </div>
  );
}

interface RecentTicketRowProps {
  ticket: {
    id: string;
    title: string;
    status: TicketStatus;
    priority?: string;
    createdAt?: string;
    updatedAt?: string;
    urgencyScore?: number;
  };
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function getPriorityConfig(priority?: string) {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'alta':
      return { label: 'Alta', color: 'text-red-400', dot: 'bg-red-400' };
    case 'medium':
    case 'media':
      return { label: 'Media', color: 'text-yellow-400', dot: 'bg-yellow-400' };
    default:
      return { label: 'Baja', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  }
}

export function RecentTicketRow({ ticket }: RecentTicketRowProps) {
  const statusConfig = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG[TicketStatus.OPEN];
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`} className="group flex items-center gap-4 px-5 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0">
      <div className={`h-2 w-2 shrink-0 rounded-full ${statusConfig.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{ticket.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-500 font-mono">#{ticket.id.slice(0, 8).toUpperCase()}</span>
          {ticket.updatedAt && <span className="text-[11px] text-slate-600">· {formatRelativeTime(ticket.updatedAt)}</span>}
        </div>
      </div>
      {ticket.priority && (
        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${priorityConfig.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${priorityConfig.dot}`} />
          <span className="sr-only">Prioridad:</span>
          {priorityConfig.label}
        </div>
      )}
      <span className="shrink-0 text-[11px] font-medium text-slate-400">{statusConfig.label}</span>
      {ticket.urgencyScore !== undefined && <UrgencyBadge score={ticket.urgencyScore} showLabel={false} />}
    </Link>
  );
}