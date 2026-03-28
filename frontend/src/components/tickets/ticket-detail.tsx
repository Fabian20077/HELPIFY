'use client';

import { useState, useEffect } from 'react';
import type { Ticket } from '@/lib/types';
import { TicketHeader } from './ticket-header';
import { TicketSidebar } from './ticket-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketTimeline } from './ticket-timeline';
import { CommentForm } from './comment-form';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface TicketDetailProps {
  initialTicket: Ticket;
  userRole: string;
}

export function TicketDetail({ initialTicket, userRole }: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommentAdded = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const updatedTicket = await api.get<Ticket>(`/tickets/${ticket.id}`, token);
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Error refreshing ticket:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 h-full max-w-6xl mx-auto w-full">
      <TicketHeader ticket={ticket} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Descripci&#243;n del Incidente</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <div className="flex-1 mt-4">
            <TicketTimeline
              key={refreshKey}
              history={ticket.history || []}
              comments={ticket.comments || []}
              currentRole={userRole as 'customer' | 'agent' | 'admin'}
            />

            <CommentForm ticketId={ticket.id} role={userRole} onCommentAdded={handleCommentAdded} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <TicketSidebar
            ticket={ticket}
            userRole={userRole}
            onTicketChange={setTicket}
          />
        </div>
      </div>
    </div>
  );
}
