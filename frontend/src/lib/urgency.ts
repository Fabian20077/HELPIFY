import type { Ticket, TicketHistory, MetricsRecentTicket } from './types';

type UrgencyTicket = Ticket | MetricsRecentTicket;

/**
 * Computes an urgency score (0-100) for a ticket based on:
 * - Hours since last agent activity (max 35 points)
 * - Number of times ticket was reopened (max 25 points)
 * - Hours spent in "waiting" status (max 20 points)
 * - Ticket priority is not factored here (handled separately)
 */
export function computeUrgencyScore(ticket: UrgencyTicket): number {
  const history = (ticket as Ticket).history ?? [];
  const createdById = (ticket as Ticket).createdById ?? '';

  const lastAgentActivity = history
    .filter((h) => h.changedBy !== createdById)
    .pop();

  const lastActivityTime = lastAgentActivity
    ? new Date(lastAgentActivity.changedAt)
    : new Date(ticket.createdAt);
  const hoursSinceResponse = (Date.now() - lastActivityTime.getTime()) / (1000 * 60 * 60);

  const previousReopenings = history.filter(
    (h) => h.fieldName === 'status' && h.oldValue === 'resolved' && h.newValue === 'in_progress'
  ).length;

  const hoursInWaiting =
    ticket.status === 'waiting'
      ? (() => {
          const lastTransition = history
            .filter((h) => h.fieldName === 'status' && h.newValue === 'waiting')
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

/**
 * Sort tickets by urgency score descending.
 */
export function sortByUrgency(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => computeUrgencyScore(b) - computeUrgencyScore(a));
}

/**
 * Get urgency badge color based on score.
 */
export function getUrgencyColor(score: number): string {
  if (score >= 70) return 'text-red-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-green-500';
}
