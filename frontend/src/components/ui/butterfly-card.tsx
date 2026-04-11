'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface ButterflyCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient';
  hover?: boolean;
  className?: string;
}

/**
 * Butterfly Card — Premium card with iridescent butterfly wing effect
 * Features gradient border on hover, depth shadow, and smooth transitions
 */
export function ButterflyCard({
  children,
  variant = 'default',
  hover = true,
  className,
  ...props
}: ButterflyCardProps) {
  const variants = {
    default: 'bg-surface border-border/30',
    elevated: 'bg-surface-elevated border-border/40 depth-shadow',
    gradient: 'bg-surface border-transparent butterfly-card',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 border transition-all duration-300',
        variants[variant],
        hover && 'hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Glass Panel — Premium frosted glass panel
 */
export function GlassPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Metric Card — Dashboard metric with glow effect
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = 'text-brand',
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  trend?: { value: string; up: boolean };
  className?: string;
}) {
  return (
    <ButterflyCard variant="gradient" hover={false} className={cn('relative overflow-hidden', className)}>
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
              <Icon className={cn('h-4 w-4', accent)} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              {label}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-foreground tracking-tight">
              {value}
            </span>
            {trend && (
              <span className={cn(
                'text-xs font-semibold',
                trend.up ? 'text-success' : 'text-danger'
              )}>
                {trend.up ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
        </div>
        
        {/* Decorative icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5">
          <Icon className={cn('h-7 w-7', accent)} />
        </div>
      </div>
    </ButterflyCard>
  );
}
