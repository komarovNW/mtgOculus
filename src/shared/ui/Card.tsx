import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/shared/lib/cn';

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    tone?: 'default' | 'muted' | 'accent';
  }
>;

export function Card({ children, className, tone = 'default', ...props }: CardProps) {
  return (
    <section
      className={cn('card', `card--${tone}`, className)}
      {...props}
    >
      {children}
    </section>
  );
}

