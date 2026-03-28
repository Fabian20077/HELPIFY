'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, SendIcon, LockIcon } from 'lucide-react';

const commentSchema = z.object({
  body: z.string().min(2, 'El comentario está muy corto').max(2000, 'Demasiado texto'),
  isInternal: z.boolean()
});

export interface CommentFormValues {
  body: string;
  isInternal: boolean;
}

interface CommentFormProps {
  ticketId: string;
  role: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ ticketId, role, onCommentAdded }: CommentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: '',
      isInternal: false,
    },
  });

  const onSubmit = async (data: CommentFormValues) => {
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      await api.post(`/tickets/${ticketId}/comments`, { body: data.body, isInternal: data.isInternal }, token);
      form.reset();
      
      if (onCommentAdded) {
        onCommentAdded();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || 'Error al enviar respuesta');
      }
    }
  };

  const isAgentOrAdmin = role === 'agent' || role === 'admin';

  return (
    <div className="mt-8 pt-6 border-t border-border/50">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="body" className="text-base">Añadir Respuesta</Label>
          <Textarea 
            id="body" 
            placeholder="Escribe tu mensaje o actualización aquí..." 
            className="min-h-[100px] resize-y bg-background"
            {...form.register('body')} 
            disabled={isPending || form.formState.isSubmitting}
          />
          {form.formState.errors.body && (
            <p className="text-destructive text-xs">{form.formState.errors.body.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            {isAgentOrAdmin && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isInternal"
                  checked={form.watch('isInternal')}
                  onCheckedChange={(checked: boolean) => form.setValue('isInternal', checked)}
                  disabled={isPending || form.formState.isSubmitting}
                />
                <Label htmlFor="isInternal" className="text-sm cursor-pointer flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-500">
                  <LockIcon className="h-3.5 w-3.5" /> Nota Interna (oculta al cliente)
                </Label>
              </div>
            )}
          </div>
          <Button type="submit" disabled={isPending || form.formState.isSubmitting}>
            {(isPending || form.formState.isSubmitting) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="mr-2 h-4 w-4" />
            )}
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}
