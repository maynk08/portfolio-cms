'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { MonthPicker } from '@/components/forms/month-picker';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

// A calendar month stored as `YYYY-MM` (or null); optional ones can be cleared.
export function MonthField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  isRequired = false,
}: FormFieldProps<T, TTransformed>) {
  const {
    field: { ref, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const id = fieldId(name);
  const error = fieldState.error?.message;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error}>
      <MonthPicker
        id={id}
        triggerRef={ref}
        value={fieldValue ?? null}
        onChange={onChange}
        onClose={onBlur}
        canClear={!isRequired}
        ariaInvalid={error !== undefined}
        ariaDescribedBy={describedByIds(id, { description, error })}
      />
    </FieldShell>
  );
}
