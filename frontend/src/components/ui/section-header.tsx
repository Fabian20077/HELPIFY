'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

/**
 * Section Header — Premium section header with icon and optional action
 */
export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Icon className="h-5 w-5 text-brand" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-display text-foreground tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-foreground-muted mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
