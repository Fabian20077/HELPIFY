'use client';

import { useState, useTransition } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Ticket, TicketStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2Icon, PlayCircleIcon, PauseCircleIcon, XCircleIcon, HistoryIcon } from 'lucide-react';

interface StatusControlsProps {
  ticketId: string;
  currentStatus: TicketStatus;
  userRole: string;
  onStatusChange: (updatedTicket: Ticket) => void;
}

const STATUS_BUTTONS: Record<TicketStatus, Array<{ target: TicketStatus; label: string; icon: React.ElementType; variant: string }>> = {
  [TicketStatus.OPEN]: [
    { target: TicketStatus.IN_PROGRESS, label: 'Iniciar Trabajo', icon: PlayCircleIcon, variant: 'default' },
    { target: TicketStatus.CLOSED, label: 'Cerrar Ticket', icon: XCircleIcon, variant: 'destructive' },
  ],
  [TicketStatus.IN_PROGRESS]: [
    { target: TicketStatus.WAITING, label: 'Pausar (Esperando)', icon: PauseCircleIcon, variant: 'secondary' },
    { target: TicketStatus.RESOLVED, label: 'Marcar Resuelto', icon: CheckCircle2Icon, variant: 'default' },
    { target: TicketStatus.CLOSED, label: 'Cerrar Ticket', icon: XCircleIcon, variant: 'destructive' },
  ],
  [TicketStatus.WAITING]: [
    { target: TicketStatus.IN_PROGRESS, label: 'Iniciar Trabajo', icon: PlayCircleIcon, variant: 'default' },
    { target: TicketStatus.RESOLVED, label: 'Marcar Resuelto', icon: CheckCircle2Icon, variant: 'default' },
    { target: TicketStatus.CLOSED, label: 'Cerrar Ticket', icon: XCircleIcon, variant: 'destructive' },
  ],
  [TicketStatus.RESOLVED]: [
    { target: TicketStatus.IN_PROGRESS, label: 'Reabrir Ticket', icon: HistoryIcon, variant: 'outline' },
    { target: TicketStatus.CLOSED, label: 'Cerrar Ticket', icon: XCircleIcon, variant: 'destructive' },
  ],
  [TicketStatus.CLOSED]: [],
};

export function StatusControls({ ticketId, currentStatus, userRole, onStatusChange }: StatusControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [loadingStatus, setLoadingStatus] = useState<TicketStatus | null>(null);

  const availableButtons = STATUS_BUTTONS[currentStatus] || [];

  const handleTransition = async (newStatus: TicketStatus) => {
    setLoadingStatus(newStatus);
    try {
      const token = getToken();
      if (!token) {
        console.error('No token available');
        return;
      }
      const response = await api.patch<{ status: string; data: Ticket }>(`/tickets/${ticketId}/status`, { status: newStatus }, token);
      onStatusChange(response.data);
    } catch (error) {
      console.error('Error transitioning status:', error);
    } finally {
      setLoadingStatus(null);
    }
  };

  if (userRole === 'customer') {
    return null;
  }

  if (availableButtons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
      {availableButtons.map(({ target, label, icon: Icon, variant }) => {
        const isLoading = loadingStatus === target;
        const disabled = isPending || loadingStatus !== null;

        return (
          <Button
            key={target}
            variant={variant as any}
            size="sm"
            onClick={() => handleTransition(target)}
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
