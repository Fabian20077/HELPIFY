'use client';

import { useState } from 'react';
import { Ticket, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserIcon, CalendarIcon, BriefcaseIcon, TagIcon, LayersIcon } from 'lucide-react';
import { AgentSelector, Agent } from './agent-selector';
import { StatusControls } from './status-controls';
import { DeleteTicketModal } from './delete-ticket-modal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface TicketSidebarProps {
  ticket: Ticket;
  userRole: string;
  onTicketChange?: (updatedTicket: Ticket) => void;
}

export function TicketSidebar({ ticket, userRole, onTicketChange }: TicketSidebarProps) {
  const handleTicketChange = onTicketChange || ((updated: Ticket) => {
    console.log('Ticket updated:', updated);
  });
  const [currentTicket, setCurrentTicket] = useState(ticket);

  const handleAssign = async (agent: Agent | null) => {
    const token = getToken();
    if (!token) {
      throw new Error('Sesión expirada. Inicia sesión de nuevo.');
    }

    try {
      await api.patch(`/tickets/${ticket.id}/assign`, { assignedToId: agent?.id ?? null }, token);
    } catch (e) {
      if (e instanceof ApiError) {
        throw new Error(e.message);
      }
      throw e;
    }

    const updated = {
      ...currentTicket,
      assignedTo: agent
        ? { name: agent.name, email: agent.email }
        : null,
      assignedToId: agent?.id || null,
    };
    setCurrentTicket(updated);
    handleTicketChange(updated);
  };

  const handleStatusChange = (updatedTicket: Ticket) => {
    setCurrentTicket(updatedTicket);
    handleTicketChange(updatedTicket);
  };

  const canAssign = userRole === UserRole.AGENT || userRole === UserRole.ADMIN;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          Detalles del Ticket
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 flex flex-col gap-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <UserIcon className="h-4 w-4" /> Solicitante
          </div>
          <div className="text-right">
            <div className="font-medium text-foreground">{ticket.createdBy?.name || 'Sistema'}</div>
            <div className="text-xs text-muted-foreground">{ticket.createdBy?.email}</div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <BriefcaseIcon className="h-4 w-4" /> Asignado a
          </div>
          <div className="text-right text-foreground flex-1 space-y-2">
            <div className={currentTicket.assignedTo ? '' : 'text-muted-foreground italic'}>
              {currentTicket.assignedTo?.name || 'Sin asignar'}
            </div>
            {canAssign && (
              <AgentSelector
                ticketId={ticket.id}
                currentAssignedToId={currentTicket.assignedToId}
                currentAssignedToName={currentTicket.assignedTo?.name || null}
                onAssign={handleAssign}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-4 mt-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <LayersIcon className="h-4 w-4" /> Prioridad
          </div>
          <Badge variant="outline" className="uppercase bg-background shadow-sm">
            {currentTicket.priority}
          </Badge>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <TagIcon className="h-4 w-4" /> Categoría
          </div>
          <div className="text-right">
            <div className="font-medium text-foreground">{ticket.category?.name || <span className="text-muted-foreground italic">Ninguna</span>}</div>
            <div className="text-xs text-muted-foreground">{ticket.department?.name}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-4 mt-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <CalendarIcon className="h-4 w-4" /> Creado
          </div>
          <div className="text-right text-foreground" title={new Date(ticket.createdAt).toLocaleString('es-ES')}>
            Hace {formatDistanceToNow(new Date(ticket.createdAt), { locale: es })}
          </div>
        </div>

        <StatusControls
          ticketId={ticket.id}
          currentStatus={currentTicket.status}
          userRole={userRole}
          onStatusChange={handleStatusChange}
        />

        {userRole === UserRole.ADMIN && (
          <div className="border-t border-border/50 pt-4 mt-2">
            <DeleteTicketModal
              ticketId={ticket.id}
              ticketTitle={ticket.title}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}