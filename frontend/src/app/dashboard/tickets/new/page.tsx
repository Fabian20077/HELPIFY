'use client';

import { useState, useEffect } from 'react';
import { TicketForm } from '@/components/tickets/ticket-form';
import type { Department, Category } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';

export const dynamic = 'force-dynamic';

export default function NewTicketPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => d.data || []).catch(() => []),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => d.data || []).catch(() => []),
    ]).then(([depts, cats]) => {
      setDepartments(depts);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 space-y-6 pt-4 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Reportar Incidente</h1>
          <p className="text-muted-foreground mt-1">
            Completa este formulario para abrir un nuevo ticket en el sistema Helpify.
          </p>
        </div>
        <div className="h-64 animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 pt-4 pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reportar Incidente</h1>
        <p className="text-muted-foreground mt-1">
          Completa este formulario para abrir un nuevo ticket en el sistema Helpify.
        </p>
      </div>

      <TicketForm departments={departments} categories={categories} />
    </div>
  );
}
