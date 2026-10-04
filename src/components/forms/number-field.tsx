'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { Input } from '@/components/ui/input';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type NumberFieldProps<T extends FieldValues, TTransformed extends FieldValues = T> = FormFieldProps<T, TTransformed> & {
  min?: number;
  max?: number;
};

// Holds a number, or null when empty.
export function NumberField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  isRequired,
  min,
  max,
}: NumberFieldProps<T, TTransformed>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const id = fieldId(name);
  const error = fieldState.error?.message;
  const value = fieldValue as number | null | undefined;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error}>
      <Input
        id={id}
        ref={ref}
        name={inputName}
        type="number"
        inputMode="numeric"
        className="max-w-40 tabular-nums"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(event) => {
          onChange(event.target.value === '' ? null : event.target.valueAsNumber);
        }}
        onBlur={onBlur}
        aria-invalid={error !== undefined}
        aria-required={isRequired}
        aria-describedby={describedByIds(id, { description, error })}
      />
    </FieldShell>
  );
}
