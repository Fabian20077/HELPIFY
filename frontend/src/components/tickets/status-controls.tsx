'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Ticket, TicketStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface StatusControlsProps {
  ticketId: string;
  currentStatus: TicketStatus;
  userRole: string;
  onStatusChange: (updatedTicket: Ticket) => void;
}

const STATUS_BUTTONS: Record<TicketStatus, Array<{ target: TicketStatus; label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary'; icon: React.ElementType }>> = {
  [TicketStatus.OPEN]: [
    { target: TicketStatus.IN_PROGRESS, label: 'Iniciar', variant: 'default', icon: Play },
    { target: TicketStatus.CLOSED, label: 'Cerrar', variant: 'destructive', icon: XCircle },
  ],
  [TicketStatus.IN_PROGRESS]: [
    { target: TicketStatus.WAITING, label: 'Pausar', variant: 'secondary', icon: Pause },
    { target: TicketStatus.RESOLVED, label: 'Resolver', variant: 'default', icon: CheckCircle },
    { target: TicketStatus.CLOSED, label: 'Cerrar', variant: 'destructive', icon: XCircle },
  ],
  [TicketStatus.WAITING]: [
    { target: TicketStatus.IN_PROGRESS, label: 'Reanudar', variant: 'default', icon: Play },
    { target: TicketStatus.RESOLVED, label: 'Resolver', variant: 'default', icon: CheckCircle },
    { target: TicketStatus.CLOSED, label: 'Cerrar', variant: 'destructive', icon: XCircle },
  ],
  [TicketStatus.RESOLVED]: [
    { target: TicketStatus.IN_PROGRESS, label: 'Reabrir', variant: 'outline', icon: RotateCcw },
    { target: TicketStatus.CLOSED, label: 'Cerrar', variant: 'destructive', icon: XCircle },
  ],
  [TicketStatus.CLOSED]: [],
};

export function StatusControls({ ticketId, currentStatus, userRole, onStatusChange }: StatusControlsProps) {
  const [loadingStatus, setLoadingStatus] = useState<TicketStatus | null>(null);
  const buttons = STATUS_BUTTONS[currentStatus] || [];

  if (userRole === 'customer' || buttons.length === 0) return null;

  const handleTransition = async (newStatus: TicketStatus) => {
    setLoadingStatus(newStatus);
    try {
      const token = getToken();
      if (!token) return;
      const response = await api.patch<{ status: string; data: Ticket }>(
        `/tickets/${ticketId}/status`,
        { status: newStatus },
        token
      );
      onStatusChange(response.data);
    } catch (error) {
      console.error('Error transitioning status:', error);
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
      {buttons.map(({ target, label, variant, icon: Icon }) => {
        const isLoading = loadingStatus === target;
        return (
          <Button
            key={target}
            variant={variant}
            size="sm"
            onClick={() => handleTransition(target)}
            disabled={loadingStatus !== null}
            className="text-xs"
          >
            {isLoading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
            ) : (
              <Icon className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
            )}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
