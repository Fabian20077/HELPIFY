import { TicketHistory, Comment as TicketComment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ActivityIcon, 
  MessageSquareIcon, 
  LockIcon, 
  CheckCircle2Icon, 
  ClockIcon, 
  AlertCircleIcon,
  UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TicketTimelineProps {
  history: TicketHistory[];
  comments: TicketComment[];
  currentRole: 'customer' | 'agent' | 'admin';
}

type TimelineItem = 
  | { type: 'history'; date: Date; data: TicketHistory }
  | { type: 'comment'; date: Date; data: TicketComment };

export function TicketTimeline({ history = [], comments = [], currentRole }: TicketTimelineProps) {
  // 1. Filter internal comments for customers
  const visibleComments = comments.filter(c => {
    if (c.isInternal) {
      return currentRole === 'agent' || currentRole === 'admin';
    }
    return true;
  });

  // 2. Merge and Sort chronologically (oldest to newest)
  const timeline: TimelineItem[] = [
    ...history.map(h => ({ type: 'history' as const, date: new Date(h.changedAt), data: h })),
    ...visibleComments.map(c => ({ type: 'comment' as const, date: new Date(c.createdAt), data: c }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (timeline.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card/50 border-dashed">
        <ActivityIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>No hay actividad registrada aún en este ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
        <ActivityIcon className="h-5 w-5" /> Timeline de Actividad
      </h3>
      
      <div className="relative pl-6 sm:pl-8 ml-2 border-l-2 border-border/60 space-y-8 pb-4">
        {timeline.map((item, index) => {
          if (item.type === 'comment') {
            return <CommentNode key={item.data.id} comment={item.data} />;
          }
          return <HistoryNode key={item.data.id} history={item.data} />;
        })}
        
        {/* Enclosure dot at the bottom to cap off the timeline visually */}
        <div className="absolute -bottom-1 -left-1.5 h-3 w-3 rounded-full bg-border/60" />
      </div>
    </div>
  );
}

// ── Node Components ─────────────────────────────────────────────────────────

function CommentNode({ comment }: { comment: TicketComment }) {
  return (
    <div className="relative group">
      {/* Timeline Indicator */}
      <span className={cn(
        "absolute -left-[35px] sm:-left-[43px] flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background",
        comment.isInternal ? "border-amber-500 text-amber-500" : "border-primary text-primary"
      )}>
        {comment.isInternal ? <LockIcon className="h-3.5 w-3.5" /> : <MessageSquareIcon className="h-3.5 w-3.5" />}
      </span>

      {/* Content Card */}
      <div className={cn(
        "rounded-lg border p-4 shadow-sm",
        comment.isInternal ? "bg-amber-500/5 border-amber-500/20" : "bg-card"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm flex items-center gap-1.5">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              {comment.author?.name || 'Usuario'}
            </div>
            {comment.isInternal && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase tracking-widest font-bold">
                Nota Interna
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] h-5 opacity-70 font-normal">
              {comment.author?.role}
            </Badge>
          </div>
          <time className="text-xs text-muted-foreground shrink-0" title={comment.createdAt}>
            {format(new Date(comment.createdAt), "d MMM, yyyy HH:mm", { locale: es })}
          </time>
        </div>
        <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {comment.body}
        </p>
      </div>
    </div>
  );
}

function HistoryNode({ history }: { history: TicketHistory }) {
  // Translate system field names
  const fieldLabel = history.fieldName === 'status' ? 'Estado cambiado' 
                   : history.fieldName === 'priority' ? 'Prioridad cambiada'
                   : history.fieldName === 'assignedToId' ? 'Ticket asignado'
                   : history.fieldName;

  // Visual cues based on field changed
  let Icon = ClockIcon;
  let colorClass = "text-muted-foreground border-border";

  if (history.fieldName === 'status') {
    if (history.newValue === 'resolved' || history.newValue === 'closed') {
      Icon = CheckCircle2Icon;
      colorClass = "text-emerald-500 border-emerald-500";
    } else if (history.newValue === 'critical' || history.newValue === 'high') {
      Icon = AlertCircleIcon;
      colorClass = "text-red-500 border-red-500";
    } else {
      Icon = ActivityIcon;
      colorClass = "text-blue-500 border-blue-500";
    }
  }

  return (
    <div className="relative group flex items-start gap-4">
      {/* Timeline Indicator */}
      <span className={cn(
        "absolute -left-[35px] sm:-left-[43px] flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background",
        colorClass
      )}>
        <Icon className="h-3.5 w-3.5" />
      </span>

      {/* Content (Inline text for system activities) */}
      <div className="flex-1 rounded-md bg-muted/30 px-4 py-2 text-sm border border-border/50">
        <p className="text-foreground/90">
          <span className="font-semibold">{history.changer?.name || 'Sistema'}</span>{' '}
          <span className="text-muted-foreground">{fieldLabel.toLowerCase()}</span>{' '}
          {history.oldValue && (
            <span className="line-through opacity-60 text-xs mx-1">{history.oldValue.replace('_', ' ')}</span>
          )}
          {history.oldValue && history.newValue && <span className="opacity-50 text-xs mr-1">→</span>}
          {history.newValue && (
            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4">
              {history.newValue.replace('_', ' ')}
            </Badge>
          )}
        </p>
        <time className="text-[10px] text-muted-foreground block mt-1">
          {format(new Date(history.changedAt), "d MMM, yyyy HH:mm", { locale: es })}
        </time>
      </div>
    </div>
  );
}
