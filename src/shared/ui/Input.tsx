import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
};

export function Input({
  label,
  helperText,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id ?? label;

  return (
    <label
      className="field"
      htmlFor={inputId}
    >
      <span className="field__label">
        {label}
        {required ? (
          <span
            aria-hidden="true"
            className="field__required"
          >
            *
          </span>
        ) : null}
      </span>
      <input
        id={inputId}
        className={cn('field__control', className)}
        required={required}
        {...props}
      />
      {helperText ? <span className="field__hint">{helperText}</span> : null}
    </label>
  );
}
