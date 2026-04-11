'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TicketPriority, Department, Category } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ButterflyCard } from '@/components/ui/butterfly-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ticketSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título es muy largo'),
  description: z.string().min(15, 'La descripción debe detallar mejor el problema (mínimo 15 caracteres)'),
  priority: z.nativeEnum(TicketPriority, { message: 'Selecciona una prioridad' }),
  departmentId: z.string().min(1, 'Selecciona un departamento'),
  categoryId: z.string().min(1, 'Selecciona una categoría').optional().or(z.literal('')),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  departments: Department[];
  categories: Category[];
}

export function TicketForm({ departments, categories }: TicketFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: TicketPriority.MEDIUM,
      departmentId: '',
      categoryId: '',
    },
  });

  const selectedDeptId = form.watch('departmentId');
  const availableCategories = categories.filter((c) => c.departmentId === selectedDeptId);

  const onSubmit = async (data: TicketFormValues) => {
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      const payload = { ...data };
      if (!payload.categoryId) delete payload.categoryId;
      
      const res = await api.post<{ id: string }>('/tickets', payload as Record<string, unknown>, token);
      
      startTransition(() => {
        router.push(`/dashboard/tickets/${res.id}`);
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Error al crear el ticket');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto relative z-10">
      <div className="butterfly-card p-6 relative">
        <SectionHeader
          title="Nuevo Ticket de Soporte"
          description="Describe el incidente con el mayor detalle posible para acelerar su resolución."
        />
        <div className="mt-6 relative z-20">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-20">

          {error && (
            <div className="bg-danger/15 border border-danger/25 text-danger text-sm p-4 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título del Problema <span className="text-danger">*</span></Label>
            <Input
              id="title"
              placeholder="Ej: No puedo acceder al sistema de facturación"
              {...form.register('title')}
              disabled={isPending || form.formState.isSubmitting}
              className="rounded-xl bg-surface/50 border-border/50 focus:border-brand/50"
            />
            {form.formState.errors.title && (
              <p className="text-danger text-xs">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento <span className="text-danger">*</span></Label>
              <Select
                disabled={isPending || form.formState.isSubmitting}
                onValueChange={(val: string | null) => {
                  form.setValue('departmentId', val || '');
                  form.setValue('categoryId', '');
                  form.clearErrors('departmentId');
                }}
              >
                <SelectTrigger className="w-full rounded-xl bg-surface/50 border-border/50">
                  {form.watch('departmentId')
                    ? departments.find(d => d.id === form.watch('departmentId'))?.name
                    : "Selecciona..."}
                </SelectTrigger>
                <SelectContent translate="no">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} translate="no">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departmentId && (
                <p className="text-sm text-danger mt-1">{form.formState.errors.departmentId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoría <span className="text-danger">*</span></Label>
              <Select
                value={form.watch('categoryId') || ''}
                disabled={isPending || form.formState.isSubmitting || !selectedDeptId}
                onValueChange={(val: string | null) => {
                  form.setValue('categoryId', val || '');
                  form.clearErrors('categoryId');
                }}
              >
                <SelectTrigger className="w-full rounded-xl bg-surface/50 border-border/50">
                  {form.watch('categoryId')
                    ? categories.find(c => c.id === form.watch('categoryId'))?.name
                    : (selectedDeptId ? "Selecciona..." : "Elige un departamento antes")}
                </SelectTrigger>
                <SelectContent translate="no">
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} translate="no">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-danger mt-1">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Prioridad Inicial <span className="text-danger">*</span></Label>
            <Select
              defaultValue={TicketPriority.MEDIUM}
              disabled={isPending || form.formState.isSubmitting}
              onValueChange={(val: string | null) => form.setValue('priority', (val as TicketPriority) || TicketPriority.MEDIUM)}
            >
              <SelectTrigger className="w-full rounded-xl bg-surface/50 border-border/50">
                {form.watch('priority') === TicketPriority.LOW && "Baja (No afecta operación)"}
                {form.watch('priority') === TicketPriority.MEDIUM && "Media (Impacto parcial)"}
                {form.watch('priority') === TicketPriority.HIGH && "Alta (Bloqueo de componente)"}
                {form.watch('priority') === TicketPriority.CRITICAL && "Crítica (Sistema caído)"}
              </SelectTrigger>
              <SelectContent translate="no">
                <SelectItem value={TicketPriority.LOW} translate="no">Baja (No afecta operación)</SelectItem>
                <SelectItem value={TicketPriority.MEDIUM} translate="no">Media (Impacto parcial)</SelectItem>
                <SelectItem value={TicketPriority.HIGH} translate="no">Alta (Bloqueo de componente)</SelectItem>
                <SelectItem value={TicketPriority.CRITICAL} translate="no">Crítica (Sistema caído)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción Detallada <span className="text-danger">*</span></Label>
            <Textarea
              id="description"
              placeholder="Pasos para reproducir, mensajes de error, etc..."
              className="min-h-[120px] resize-y rounded-xl bg-surface/50 border-border/50 focus:border-brand/50"
              {...form.register('description')}
              disabled={isPending || form.formState.isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-danger text-xs">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/30">
            <GradientButton
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isPending || form.formState.isSubmitting}
            >
              Cancelar
            </GradientButton>
            <GradientButton type="submit" variant="primary" size="lg" disabled={isPending || form.formState.isSubmitting}>
              {(isPending || form.formState.isSubmitting) && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Ticket
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
