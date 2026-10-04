import type { Control, FieldPath, FieldValues } from 'react-hook-form';

// What every field component takes; `control` ties `name` to the form's own types.
// `TTransformed` is what the form's schema turns the values into; it comes along with `control` and needs no attention.
export interface FormFieldProps<T extends FieldValues, TTransformed extends FieldValues = T> {
  control: Control<T, unknown, TTransformed>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  isRequired?: boolean;
}

export function fieldId(name: string): string {
  return `field-${name.replaceAll('.', '-')}`;
}
