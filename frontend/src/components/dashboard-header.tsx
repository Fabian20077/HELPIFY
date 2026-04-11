'use client';

import { useState, useEffect } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { getToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

export function DashboardHeader() {
  const [initialCount, setInitialCount] = useState(0);

  useEffect(() => {
    async function fetchInitialCount() {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success') setInitialCount(data.unreadCount);
      } catch { /* ignore */ }
    }
    fetchInitialCount();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/30 bg-background/80 backdrop-blur-md px-4 py-2.5 lg:px-6">
      <div className="flex items-center justify-end">
        <NotificationBell initialCount={initialCount} />
      </div>
    </header>
  );
}
