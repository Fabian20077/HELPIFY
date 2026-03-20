'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/auth-provider';
import { DepartmentsList } from '@/components/admin/departments-list';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function DepartmentsPage() {
  const { user, token } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
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

    api.get<any[]>('/departments')
      .then(setDepartments)
      .catch(() => setDepartments([]))
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

  return <DepartmentsList initialDepartments={departments} />;
}
