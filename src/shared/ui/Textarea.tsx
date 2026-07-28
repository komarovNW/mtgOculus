import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helperText?: string;
};

export function Textarea({
  label,
  helperText,
  className,
  id,
  required,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label;

  return (
    <label
      className="field"
      htmlFor={textareaId}
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
      <textarea
        id={textareaId}
        className={cn('field__control field__control--textarea', className)}
        required={required}
        {...props}
      />
      {helperText ? <span className="field__hint">{helperText}</span> : null}
    </label>
  );
}
