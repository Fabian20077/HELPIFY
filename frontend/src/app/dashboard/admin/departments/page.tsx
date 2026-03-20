import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { DepartmentsList } from '@/components/admin/departments-list';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getDepartments() {
  try {
    const token = await getToken();
    const departments = await api.get<any[]>('/departments', token as string);
    return departments || [];
  } catch {
    return [];
  }
}

async function getToken() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('helpify-token')?.value;
}

export default async function DepartmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const departments = await getDepartments();

  return <DepartmentsList initialDepartments={departments} />;
}