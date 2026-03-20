import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { UsersList } from '@/components/admin/users-list';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getUsers() {
  try {
    const token = await getToken();
    const users = await api.get<any[]>('/users', token as string);
    return users || [];
  } catch {
    return [];
  }
}

async function getToken() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('helpify-token')?.value;
}

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const users = await getUsers();

  return <UsersList initialUsers={users} />;
}