'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/auth-provider';
import { UsersList } from '@/components/admin/users-list';
import type { UsersListProps } from '@/components/admin/users-list';
import { UserRole, type User } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function UsersPage() {
  const { user, token } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [users, setUsers] = useState<(User & { department?: { id: string; name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== UserRole.ADMIN) {
      router.replace('/dashboard');
      return;
    }
    if (!token) return;

    api.get<User[]>('/users')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex-1 space-y-6 pt-4">
        <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
        <div className="h-64 animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  return <UsersList initialUsers={users as UsersListProps['initialUsers']} />;
}
