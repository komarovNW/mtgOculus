import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/shared/lib/cn';

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    variant?: 'neutral' | 'accent' | 'warning';
  }
>;

export function Badge({ children, className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn('badge', `badge--${variant}`, className)}
      {...props}
    >
      {children}
    </span>
  );
}

