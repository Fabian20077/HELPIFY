'use client';

import { PlusCircleIcon, InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  type?: 'tickets' | 'users' | 'default';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ type = 'default', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
      {/* Illustration - Stripe style lines */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
        {type === 'tickets' ? (
          <InboxIcon className="h-8 w-8 text-slate-500 empty-state-icon" />
        ) : (
          <svg className="h-8 w-8 text-slate-500 empty-state-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        )}
      </div>

      <h3 className="text-base font-semibold text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-400 active:scale-[0.97]"
        >
          <PlusCircleIcon className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}