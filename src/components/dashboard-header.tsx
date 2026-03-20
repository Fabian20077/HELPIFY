'use client';

import { NotificationBell } from '@/components/notification-bell';

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-3 lg:px-8">
      <div className="flex-1" />
      <NotificationBell />
    </div>
  );
}