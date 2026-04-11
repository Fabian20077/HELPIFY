import { Ticket, TicketStatus, TicketPriority } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquareIcon, PaperclipIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';

interface TicketCardProps {
  ticket: Ticket;
}

const statusDictionary: Record<TicketStatus, { label: string; colorClass: string; borderClass: string }> = {
  [TicketStatus.OPEN]: { label: 'Abierto', colorClass: 'bg-sky-500/15 text-sky-400', borderClass: 'border-sky-500/30' },
  [TicketStatus.IN_PROGRESS]: { label: 'En Progreso', colorClass: 'bg-brand/15 text-brand', borderClass: 'border-brand/30' },
  [TicketStatus.WAITING]: { label: 'En Espera', colorClass: 'bg-warning/15 text-warning', borderClass: 'border-warning/30' },
  [TicketStatus.RESOLVED]: { label: 'Resuelto', colorClass: 'bg-success/15 text-success', borderClass: 'border-success/30' },
  [TicketStatus.CLOSED]: { label: 'Cerrado', colorClass: 'bg-foreground-subtle/15 text-foreground-subtle', borderClass: 'border-foreground-subtle/30' },
};

const priorityDictionary: Record<TicketPriority, { label: string }> = {
  [TicketPriority.LOW]: { label: 'Baja' },
  [TicketPriority.MEDIUM]: { label: 'Media' },
  [TicketPriority.HIGH]: { label: 'Alta' },
  [TicketPriority.CRITICAL]: { label: 'Crítica' },
};

export function getUrgencyColorClass(score: number): string {
  if (score <= 25) return 'bg-green-500';
  if (score <= 50) return 'bg-yellow-500';
  if (score <= 75) return 'bg-orange-500';
  return 'bg-red-500';
}

export function TicketCard({ ticket }: TicketCardProps) {
  const statusDef = statusDictionary[ticket.status];
  const priorityDef = priorityDictionary[ticket.priority];
  const urgencyColor = getUrgencyColorClass(ticket.urgencyScore ?? 0);

  // Custom Urgency Label
  let urgencyLabel = 'Baja';
  if ((ticket.urgencyScore ?? 0) > 25) urgencyLabel = 'Media';
  if ((ticket.urgencyScore ?? 0) > 50) urgencyLabel = 'Alta';
  if ((ticket.urgencyScore ?? 0) > 75) urgencyLabel = 'Crítica';

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`} className="block transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/5">
      <Card className="overflow-hidden h-full flex flex-col relative border border-border/30 rounded-2xl hover:border-brand/30">

        {/* Identidad de Urgencia: Top Color Bar */}
        <div className={`h-1.5 w-full ${urgencyColor}`} />

        <CardContent className="p-5 flex flex-col gap-4 flex-1">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground" title={ticket.title}>
              {ticket.title}
            </h3>
            <div className="flex gap-2 shrink-0">
              <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${statusDef.colorClass} ${statusDef.borderClass}`}>
                {statusDef.label}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {ticket.description}
          </p>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mt-auto pt-4 border-t border-border/30">

            <div className="flex items-center text-muted-foreground">
              <span className="font-medium mr-1 text-foreground">Score:</span>
              <span className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${urgencyColor}`} />
                {ticket.urgencyScore ?? 0} ({urgencyLabel})
              </span>
            </div>

            <div className="flex items-center text-muted-foreground">
              <span className="font-medium mr-1 text-foreground">Prioridad:</span>
              {priorityDef.label}
            </div>

            <div className="flex items-center text-muted-foreground" title={new Date(ticket.createdAt).toLocaleString('es-ES')}>
               <ClockIcon className="h-3 w-3 mr-1" />
               {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}
            </div>

            <div className="flex items-center justify-end gap-3 text-muted-foreground">
              <div className="flex items-center gap-1" title={`${ticket._count?.comments ?? 0} comentarios`}>
                <MessageSquareIcon className="h-3 w-3" />
                <span>{ticket._count?.comments ?? 0}</span>
              </div>
              <div className="flex items-center gap-1" title={`${ticket._count?.attachments ?? 0} adjuntos`}>
                <PaperclipIcon className="h-3 w-3" />
                <span>{ticket._count?.attachments ?? 0}</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
