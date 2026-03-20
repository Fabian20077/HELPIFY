import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { CategoriesList } from '@/components/admin/categories-list';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getData() {
  try {
    const token = await getToken();
    const [categories, departments] = await Promise.all([
      api.get<any[]>('/categories', token as string),
      api.get<any[]>('/departments', token as string),
    ]);
    return {
      categories: categories || [],
      departments: departments || [],
    };
  } catch {
    return { categories: [], departments: [] };
  }
}

async function getToken() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('helpify-token')?.value;
}

export default async function CategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const { categories, departments } = await getData();

  return <CategoriesList initialCategories={categories} initialDepartments={departments} />;
}