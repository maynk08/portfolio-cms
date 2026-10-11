'use client';

import { useController, useWatch } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { MonthPicker } from '@/components/forms/month-picker';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldPath, FieldValues } from 'react-hook-form';

type MonthFieldProps<T extends FieldValues, TTransformed extends FieldValues> = FormFieldProps<T, TTransformed> & {
  // Another month field to open near while this one is empty, e.g. the start month for the end month.
  openNear?: FieldPath<T>;
};

// A calendar month stored as `YYYY-MM` (or null); optional ones can be cleared.
export function MonthField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  isRequired = false,
  openNear,
}: MonthFieldProps<T, TTransformed>) {
  const {
    field: { ref, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  // Watching the field itself when there is nothing to open near keeps the hook call unconditional.
  const nearValue: unknown = useWatch({ control, name: openNear ?? name });
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
        openNear={openNear !== undefined && typeof nearValue === 'string' ? nearValue : null}
        ariaInvalid={error !== undefined}
        ariaDescribedBy={describedByIds(id, { description, error })}
      />
    </FieldShell>
  );
}
