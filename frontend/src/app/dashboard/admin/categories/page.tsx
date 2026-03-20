'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/auth-provider';
import { CategoriesList } from '@/components/admin/categories-list';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
  const { user, token } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
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

    Promise.all([
      api.get<any[]>('/categories'),
      api.get<any[]>('/departments'),
    ])
      .then(([cats, depts]) => {
        setCategories(cats || []);
        setDepartments(depts || []);
      })
      .catch(() => {
        setCategories([]);
        setDepartments([]);
      })
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

  return <CategoriesList initialCategories={categories} initialDepartments={departments} />;
}
