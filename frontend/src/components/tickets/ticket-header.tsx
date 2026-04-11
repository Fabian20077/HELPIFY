'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import type { Ticket } from '@/lib/types';

interface TicketHeaderProps {
  ticket: Ticket;
}

export function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/dashboard/tickets" />}>
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{ticket.title}</h1>
          <Badge variant="outline" className="text-xs uppercase bg-background shadow-sm">
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
          Ticket ID: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{ticket.id}</span>
        </p>
      </div>
    </div>
  );
}
