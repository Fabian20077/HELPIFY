'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2Icon, AlertTriangleIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface DeleteTicketModalProps {
  ticketId: string;
  ticketTitle: string;
}

export function DeleteTicketModal({ ticketId, ticketTitle }: DeleteTicketModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Sesión expirada');
      }
      await api.delete(`/tickets/${ticketId}`, token);

      setOpen(false);
      router.push('/dashboard/tickets');
      router.refresh();
    } catch (error) {
      console.error('Delete failed:', error);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-4 border-destructive/30 text-destructive"
          />
        }
      >
        <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
        Eliminar Ticket
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Eliminar Ticket
          </DialogTitle>
          <DialogDescription className="space-y-3 text-foreground">
            <span>
              ¿Estás seguro de que quieres eliminar el ticket{' '}
              <strong>&quot;{ticketTitle}&quot;</strong>?
            </span>
            <span className="text-destructive/80 font-medium">
              Esta acción no se puede deshacer.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
