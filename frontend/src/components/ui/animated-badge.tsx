'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface AnimatedBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const variantClasses: Record<string, string> = {
  default: 'bg-brand/15 text-brand border-brand/25',
  success: 'bg-success/15 text-success border-success/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  danger: 'bg-danger/15 text-danger border-danger/25',
  info: 'bg-info/15 text-info border-info/25',
};

/**
 * Animated Badge — Badge with butterfly-inspired pulse animation
 */
export function AnimatedBadge({
  children,
  variant = 'default',
  pulse = false,
  size = 'md',
  className,
  ...props
}: AnimatedBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold border',
        sizeClasses[size],
        variantClasses[variant],
        pulse && 'butterfly-pulse',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
