import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  helperText?: string;
};

export function Select({ label, options, helperText, className, id, ...props }: SelectProps) {
  const selectId = id ?? label;

  return (
    <label
      className="field"
      htmlFor={selectId}
    >
      <span className="field__label">{label}</span>
      <select
        id={selectId}
        className={cn('field__control', 'field__control--select', className)}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? <span className="field__hint">{helperText}</span> : null}
    </label>
  );
}
