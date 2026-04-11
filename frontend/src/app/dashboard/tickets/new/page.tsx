'use client';

import { useState, useEffect } from 'react';
import { TicketForm } from '@/components/tickets/ticket-form';
import type { Department, Category } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { API_BASE_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Eliminar duplicados por ID
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function NewTicketPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(`${API_BASE_URL}/departments?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => d.data || []).catch(() => []),
      fetch(`${API_BASE_URL}/categories?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => d.data || []).catch(() => []),
    ]).then(([depts, cats]) => {
      setDepartments(dedupeById(depts));
      setCategories(dedupeById(cats));
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
