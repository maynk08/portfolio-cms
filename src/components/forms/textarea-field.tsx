'use client';

import { useController } from 'react-hook-form';

import { CharacterCount } from '@/components/forms/character-count';
import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { Textarea } from '@/components/ui/textarea';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type TextareaFieldProps<T extends FieldValues> = FormFieldProps<T> & {
  maxLength: number;
  rows?: number;
};

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  isRequired,
  maxLength,
  rows = 4,
}: TextareaFieldProps<T>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const id = fieldId(name);
  const error = fieldState.error?.message;
  const value = (fieldValue as string | null | undefined) ?? '';
  const hint = <CharacterCount length={value.length} maxLength={maxLength} />;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error} hint={hint}>
      <Textarea
        id={id}
        ref={ref}
        name={inputName}
        rows={rows}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error !== undefined}
        aria-required={isRequired}
        aria-describedby={describedByIds(id, { description, error, hint })}
      />
    </FieldShell>
  );
}
