'use client';

import { useState, useEffect } from 'react';
import { Ticket, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserIcon, CalendarIcon, BriefcaseIcon, TagIcon, LayersIcon, EyeIcon, PlusIcon, XIcon } from 'lucide-react';
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

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function TicketSidebar({ ticket, userRole, onTicketChange }: TicketSidebarProps) {
  const handleTicketChange = onTicketChange || ((updated: Ticket) => {
    console.log('Ticket updated:', updated);
  });
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [showObserverInput, setShowObserverInput] = useState(false);
  const [observerQuery, setObserverQuery] = useState('');
  const [observerResults, setObserverResults] = useState<UserOption[]>([]);
  const [loadingObservers, setLoadingObservers] = useState(false);

  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket]);

  useEffect(() => {
    if (observerQuery.length >= 2 && showObserverInput) {
      const searchUsers = async () => {
        setLoadingObservers(true);
        try {
          const token = getToken();
          if (!token) return;
          const users = await api.get<UserOption[]>(`/users/search?q=${observerQuery}`, token);
          const currentObserverIds = currentTicket.observers?.map(o => o.userId) || [];
          const filtered = users.filter(u => 
            u.id !== ticket.createdById && 
            u.id !== ticket.assignedToId &&
            !currentObserverIds.includes(u.id)
          );
          setObserverResults(filtered);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setLoadingObservers(false);
        }
      };
      const timeout = setTimeout(searchUsers, 300);
      return () => clearTimeout(timeout);
    } else {
      setObserverResults([]);
    }
  }, [observerQuery, showObserverInput]);

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

  const handleAddObserver = async (user: UserOption) => {
    try {
      const token = getToken();
      if (!token) return;
      
      const observer = await api.post<{ id: string; userId: string }>(`/tickets/${ticket.id}/observers`, { userId: user.id }, token);
      
      const newObserver = {
        id: observer.id,
        userId: user.id,
        user: { id: user.id, name: user.name, email: user.email },
        ticketId: ticket.id,
        createdAt: new Date().toISOString()
      };
      
      const updated = {
        ...currentTicket,
        observers: [...(currentTicket.observers || []), newObserver]
      };
      setCurrentTicket(updated);
      handleTicketChange(updated);
      setShowObserverInput(false);
      setObserverQuery('');
      setObserverResults([]);
    } catch (error) {
      console.error('Error adding observer:', error);
    }
  };

  const handleRemoveObserver = async (observerId: string, observerUserId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      
      await api.delete(`/tickets/${ticket.id}/observers/${observerUserId}`, token);
      
      const updated = {
        ...currentTicket,
        observers: (currentTicket.observers || []).filter(o => o.userId !== observerUserId)
      };
      setCurrentTicket(updated);
      handleTicketChange(updated);
    } catch (error) {
      console.error('Error removing observer:', error);
    }
  };

  const canAssign = userRole === UserRole.AGENT || userRole === UserRole.ADMIN;
  const canManageObservers = userRole === UserRole.AGENT || userRole === UserRole.ADMIN;

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

        {/* Observadores */}
        <div className="border-t border-border/50 pt-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <EyeIcon className="h-4 w-4" /> Observadores
            </div>
            {canManageObservers && !showObserverInput && (
              <button
                onClick={() => setShowObserverInput(true)}
                className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <PlusIcon className="h-3 w-3" /> Añadir
              </button>
            )}
          </div>
          
          {showObserverInput && (
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={observerQuery}
                onChange={(e) => setObserverQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500"
                autoFocus
              />
              {observerResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-40 overflow-y-auto z-10">
                  {observerResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddObserver(user)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-700 flex flex-col"
                    >
                      <span className="text-slate-200">{user.name}</span>
                      <span className="text-slate-500">{user.email}</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setShowObserverInput(false); setObserverQuery(''); }}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1">
            {currentTicket.observers && currentTicket.observers.length > 0 ? (
              currentTicket.observers.map(observer => (
                <Badge
                  key={observer.id}
                  variant="secondary"
                  className="text-xs bg-slate-800 text-slate-300"
                >
                  {observer.user?.name}
                  {canManageObservers && (
                    <button
                      onClick={() => handleRemoveObserver(observer.id, observer.userId)}
                      className="ml-1 text-slate-500 hover:text-red-400"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-600">Sin observadores</span>
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