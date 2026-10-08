'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

// A yes/no statement about the item ("I currently work here"); use a switch for settings that turn something on.
export function CheckboxField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
}: Omit<FormFieldProps<T, TTransformed>, 'isRequired'>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
  } = useController({ control, name });
  const id = fieldId(name);

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        ref={ref}
        name={inputName}
        checked={fieldValue === true}
        onCheckedChange={(checked) => {
          onChange(checked === true);
        }}
        onBlur={onBlur}
        aria-describedby={description === undefined ? undefined : `${id}-description`}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description !== undefined && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      </FieldContent>
    </Field>
  );
}
