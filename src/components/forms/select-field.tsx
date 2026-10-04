'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type SelectFieldProps<T extends FieldValues> = FormFieldProps<T> & {
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  isRequired,
  options,
  placeholder = 'Select…',
}: SelectFieldProps<T>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const id = fieldId(name);
  const error = fieldState.error?.message;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error}>
      <Select
        name={inputName}
        value={fieldValue ?? ''}
        onValueChange={onChange}
        onOpenChange={(open) => {
          if (!open) {
            onBlur();
          }
        }}
      >
        <SelectTrigger
          id={id}
          ref={ref}
          className="w-full max-w-sm"
          aria-invalid={error !== undefined}
          aria-required={isRequired}
          aria-describedby={describedByIds(id, { description, error })}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
