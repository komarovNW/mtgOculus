import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/shared/lib/cn';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
  }
>;

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn('button', `button--${variant}`, fullWidth && 'button--full', className)}
      {...props}
    >
      {children}
    </button>
  );
}

