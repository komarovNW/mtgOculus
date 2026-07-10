import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
};

export function Input({ label, helperText, className, id, ...props }: InputProps) {
  const inputId = id ?? label;

  return (
    <label
      className="field"
      htmlFor={inputId}
    >
      <span className="field__label">{label}</span>
      <input
        id={inputId}
        className={cn('field__control', className)}
        {...props}
      />
      {helperText ? <span className="field__hint">{helperText}</span> : null}
    </label>
  );
}

