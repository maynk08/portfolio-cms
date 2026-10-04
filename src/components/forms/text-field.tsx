'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { Input } from '@/components/ui/input';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type TextFieldProps<T extends FieldValues> = FormFieldProps<T> & {
  type?: 'text' | 'email' | 'url';
  placeholder?: string;
  autoComplete?: string;
};

// Single-line text. An empty field holds '', which the form's schema turns into null for optional values.
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  isRequired,
  type = 'text',
  placeholder,
  autoComplete,
}: TextFieldProps<T>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const id = fieldId(name);
  const error = fieldState.error?.message;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error}>
      <Input
        id={id}
        ref={ref}
        name={inputName}
        type={type}
        value={fieldValue ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error !== undefined}
        aria-required={isRequired}
        aria-describedby={describedByIds(id, { description, error })}
      />
    </FieldShell>
  );
}
