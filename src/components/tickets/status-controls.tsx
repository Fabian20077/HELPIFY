'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTicketStatusAction } from '@/app/actions/ticket.actions';
import { TicketStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2Icon, PlayCircleIcon, PauseCircleIcon, XCircleIcon, HistoryIcon } from 'lucide-react';

interface StatusControlsProps {
  ticketId: string;
  currentStatus: TicketStatus;
  userRole: string;
}

// State machine rules - synced with backend ticket-state-machine.ts
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.WAITING]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [], // Estado terminal — no puede cambiar
} as const;

export function StatusControls({ ticketId, currentStatus, userRole }: StatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingStatus, setLoadingStatus] = useState<TicketStatus | null>(null);

  // Derive allowed transitions
  let availableTransitions = VALID_TRANSITIONS[currentStatus] || [];

  // Customer restrictions (can only close their tickets)
  if (userRole === 'customer') {
    if (currentStatus === TicketStatus.OPEN || currentStatus === TicketStatus.IN_PROGRESS || currentStatus === TicketStatus.WAITING) {
      availableTransitions = [TicketStatus.CLOSED];
    }
    // Customers cannot change tickets from resolved or closed
  }

  const handleTransition = async (newStatus: TicketStatus) => {
    setLoadingStatus(newStatus);
    try {
      await updateTicketStatusAction(ticketId, newStatus);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Error transitioning status:', error);
      // Fallback UI error handling could be added here
    } finally {
      setLoadingStatus(null);
    }
  };

  const getStatusButtonUI = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.IN_PROGRESS:
        return { label: 'Iniciar Trabajo', icon: PlayCircleIcon, variant: 'default' };
      case TicketStatus.WAITING:
        return { label: 'Pausar (Esperando)', icon: PauseCircleIcon, variant: 'secondary' };
      case TicketStatus.RESOLVED:
        return { label: 'Marcar Resuelto', icon: CheckCircle2Icon, variant: 'default' };
      case TicketStatus.CLOSED:
        return { label: 'Cerrar Ticket', icon: XCircleIcon, variant: 'destructive' };
      case TicketStatus.OPEN:
        return { label: 'Reabrir Ticket', icon: HistoryIcon, variant: 'outline' };
      default:
        return { label: (status as string).replace('_', ' '), icon: PlayCircleIcon, variant: 'outline' };
    }
  };

  if (availableTransitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
      {availableTransitions.map((status) => {
        const { label, icon: Icon, variant } = getStatusButtonUI(status);
        const isLoading = loadingStatus === status;
        const disabled = isPending || loadingStatus !== null;

        return (
          <Button
            key={status}
            variant={variant as any}
            size="sm"
            onClick={() => handleTransition(status)}
            disabled={disabled}
            className="text-xs"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="mr-1.5 h-3.5 w-3.5" />
            )}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
