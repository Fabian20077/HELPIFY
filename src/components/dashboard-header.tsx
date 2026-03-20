'use client';

import { useState, useEffect } from 'react';
import { NotificationBell } from '@/components/notification-bell';

export function DashboardHeader() {
  const [initialCount, setInitialCount] = useState(0);

  useEffect(() => {
    async function fetchInitialCount() {
      try {
        const res = await fetch('/api/notifications', {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.status === 'success') {
          setInitialCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching initial count:', error);
      }
    }
    fetchInitialCount();
  }, []);

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-3 lg:px-8">
      <div className="flex-1" />
      <NotificationBell initialCount={initialCount} />
    </div>
  );
}