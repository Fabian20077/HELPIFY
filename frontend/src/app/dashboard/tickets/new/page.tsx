import { api } from '@/lib/api';
import { Department, Category } from '@/lib/types';
import { getToken } from '@/lib/auth';
import { TicketForm } from '@/components/tickets/ticket-form';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  const token = await getToken();
  if (!token) redirect('/login');

  try {
    // Both API endpoints fetched in parallel
    const [deptRes, catRes] = await Promise.all([
      api.getPaginated<Department[]>('/departments?limit=100', token).catch(() => null),
      api.getPaginated<Category[]>('/categories?limit=500', token).catch(() => null),
    ]);

    // Our backend returns the array directly inside the `data` property
    return {
      departments: deptRes?.data || [],
      categories: catRes?.data || [],
    };
  } catch (error) {
    console.error('Error fetching data for ticket form:', error);
    return { departments: [], categories: [] };
  }
}

export default async function NewTicketPage() {
  const { departments, categories } = await getInitialData();

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
