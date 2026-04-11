import { calculateUrgencyScore } from './urgency-score';

export interface TicketWithHistory {
  id: string;
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  history: Array<{
    changedBy: string;
    changedAt: Date;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
}

export function computeTicketUrgencyScore(ticket: TicketWithHistory): number {
  const lastAgentActivity = ticket.history
    .filter(h => h.changedBy !== ticket.createdById)
    .pop();

  const lastActivityTime = lastAgentActivity
    ? new Date(lastAgentActivity.changedAt)
    : new Date(ticket.createdAt);
  const hoursSinceResponse = (Date.now() - lastActivityTime.getTime()) / (1000 * 60 * 60);

  const previousReopenings = ticket.history.filter(
    h => h.fieldName === 'status' && h.oldValue === 'resolved' && h.newValue === 'in_progress'
  ).length;

  const hoursInWaiting =
    ticket.status === 'waiting'
      ? (() => {
          const lastTransition = ticket.history
            .filter(h => h.fieldName === 'status' && h.newValue === 'waiting')
            .pop();
          return lastTransition
            ? (Date.now() - new Date(lastTransition.changedAt).getTime()) / (1000 * 60 * 60)
            : 0;
        })()
      : 0;

  const result = calculateUrgencyScore({
    hoursSinceLastActivity: hoursSinceResponse,
    reopenCount: previousReopenings,
    userRecentTicketCount: 0,
    hoursInWaiting,
  });

  return result.total;
}
