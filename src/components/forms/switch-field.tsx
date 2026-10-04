'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

// An on/off setting; it always has a value, so it is never marked required.
export function SwitchField<T extends FieldValues, TTransformed extends FieldValues = T>({
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
      <Switch
        id={id}
        ref={ref}
        name={inputName}
        checked={fieldValue}
        onCheckedChange={onChange}
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
