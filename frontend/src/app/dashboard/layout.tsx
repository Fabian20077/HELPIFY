'use client';

import { useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/lib/types';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect en useEffect, no durante render
  useEffect(() => {
    if (!user && !loading) {
      router.replace('/login');
    } else if (user?.role === UserRole.PENDING) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 shadow-glass-lg text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-foreground-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user.role === UserRole.PENDING) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 shadow-glass-lg text-center">
          <p className="text-sm text-foreground-muted">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // AuthProvider ya está en root layout, no necesitamos duplicarlo
  return <DashboardContent>{children}</DashboardContent>;
}
