'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { TicketStatus, TicketPriority } from '@/lib/types';

interface MetricsStatusCardProps {
  label: string;
  count: number;
  status: TicketStatus | 'unassigned';
  variant?: 'default' | 'highlight' | 'danger';
}

export function MetricsStatusCard({ label, count, status, variant = 'default' }: MetricsStatusCardProps) {
  const router = useRouter();

  const variantClasses: Record<string, string> = {
    default: 'bg-card hover:bg-accent/50 cursor-pointer',
    highlight: 'bg-primary/10 border-primary/30 hover:bg-primary/15 cursor-pointer',
    danger: 'bg-destructive/10 border-destructive/30 hover:bg-destructive/15 cursor-pointer',
  };

  const handleClick = () => {
    if (status === 'unassigned') {
      router.push('/dashboard/tickets?unassigned=true');
    } else {
      router.push(`/dashboard/tickets?status=${status}`);
    }
  };

  return (
    <div onClick={handleClick} className="group cursor-pointer">
      <Card className={`transition-all hover:shadow-md hover:-translate-y-0.5 ${variantClasses[variant]}`}>
        <CardContent className="p-5 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-4xl font-bold tabular-nums">{count}</span>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricsHighlightCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'highlight' | 'danger';
}

export function MetricsHighlightCard({ label, value, sublabel, variant = 'highlight' }: MetricsHighlightCardProps) {
  const variantClasses: Record<string, string> = {
    highlight: 'bg-primary/10 border-primary/30',
    danger: 'bg-destructive/10 border-destructive/30',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-5 flex flex-col items-center justify-center gap-1 text-center">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
      </CardContent>
    </Card>
  );
}

interface RecentTicketRowProps {
  ticket: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
    updatedAt: string;
    urgencyScore: number;
  };
}

const statusDictionary: Record<TicketStatus, { label: string; colorClass: string }> = {
  [TicketStatus.OPEN]: { label: 'Abierto', colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  [TicketStatus.IN_PROGRESS]: { label: 'En Progreso', colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  [TicketStatus.WAITING]: { label: 'En Espera', colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  [TicketStatus.RESOLVED]: { label: 'Resuelto', colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  [TicketStatus.CLOSED]: { label: 'Cerrado', colorClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
};

const priorityDictionary: Record<TicketPriority, { label: string }> = {
  [TicketPriority.LOW]: { label: 'Baja' },
  [TicketPriority.MEDIUM]: { label: 'Media' },
  [TicketPriority.HIGH]: { label: 'Alta' },
  [TicketPriority.CRITICAL]: { label: 'Crítica' },
};

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

export function RecentTicketRow({ ticket }: RecentTicketRowProps) {
  const urgencyColor = getUrgencyColor(ticket.urgencyScore);
  const urgencyLabel = getUrgencyLabel(ticket.urgencyScore);
  const statusDef = statusDictionary[ticket.status];
  const priorityDef = priorityDictionary[ticket.priority];

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors rounded-lg group">
      <div className={`h-2 w-2 rounded-full shrink-0 ${urgencyColor}`} title={`Urgencia: ${urgencyLabel} (${ticket.urgencyScore})`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ticket.title}</p>
      </div>

      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${statusDef.colorClass}`}>
        {statusDef.label}
      </span>

      <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
        {priorityDef.label}
      </span>

      <div className="flex items-center gap-1 shrink-0 w-28">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${urgencyColor}`} style={{ width: `${ticket.urgencyScore}%` }} />
        </div>
        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{ticket.urgencyScore}</span>
      </div>
    </Link>
  );
}
