import type { Control, FieldPath, FieldValues } from 'react-hook-form';

// What every field component takes; `control` ties `name` to the form's own types.
export interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  isRequired?: boolean;
}

export function fieldId(name: string): string {
  return `field-${name.replaceAll('.', '-')}`;
}
