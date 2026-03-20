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

interface TicketSidebarProps {
  ticket: Ticket;
  userRole: string;
  onTicketChange: (updatedTicket: Ticket) => void;
}

interface TicketSidebarProps {
  ticket: Ticket;
  userRole: string;
}

export function TicketSidebar({ ticket, userRole, onTicketChange }: TicketSidebarProps) {
  const [currentTicket, setCurrentTicket] = useState(ticket);

  const handleAssign = async (agent: Agent | null) => {
    const res = await fetch(`/api/tickets/${ticket.id}/assign`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId: agent?.id || null }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Error al asignar');
    }

    const updated = {
      ...currentTicket,
      assignedTo: agent
        ? { name: agent.name, email: agent.email }
        : null,
      assignedToId: agent?.id || null,
    };
    setCurrentTicket(updated);
    onTicketChange(updated);
  };

  const handleStatusChange = (updatedTicket: Ticket) => {
    setCurrentTicket(updatedTicket);
    onTicketChange(updatedTicket);
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