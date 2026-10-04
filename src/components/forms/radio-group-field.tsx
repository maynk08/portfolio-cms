'use client';

import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, Field } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type RadioGroupFieldProps<T extends FieldValues, TTransformed extends FieldValues = T> = Omit<
  FormFieldProps<T, TTransformed>,
  'isRequired'
> & {
  options: { value: string; label: string; description?: string }[];
};

// One choice out of a few, all visible at once.
export function RadioGroupField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  options,
}: RadioGroupFieldProps<T, TTransformed>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
  } = useController({ control, name });
  const id = fieldId(name);

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      {description !== undefined && <FieldDescription>{description}</FieldDescription>}
      <RadioGroup ref={ref} name={inputName} value={fieldValue} onValueChange={onChange} onBlur={onBlur}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <Field key={option.value} orientation="horizontal">
              <RadioGroupItem
                id={optionId}
                value={option.value}
                aria-describedby={option.description === undefined ? undefined : `${optionId}-description`}
              />
              <FieldContent>
                <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
                {option.description !== undefined && (
                  <FieldDescription id={`${optionId}-description`}>{option.description}</FieldDescription>
                )}
              </FieldContent>
            </Field>
          );
        })}
      </RadioGroup>
    </FieldSet>
  );
}
