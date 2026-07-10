import type { InputHTMLAttributes } from 'react';

type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  helperText?: string;
};

export function FileInput({ label, helperText, id, ...props }: FileInputProps) {
  const inputId = id ?? label;

  return (
    <label
      className="field"
      htmlFor={inputId}
    >
      <span className="field__label">{label}</span>
      <input
        id={inputId}
        className="field__control field__control--file"
        type="file"
        {...props}
      />
      {helperText ? <span className="field__hint">{helperText}</span> : null}
    </label>
  );
}

