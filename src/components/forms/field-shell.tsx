import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

import type { ReactNode } from 'react';

export interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  isRequired?: boolean;
  error?: string;
  // Extra text tied to the input, such as a character count.
  hint?: ReactNode;
  children: ReactNode;
}

// The ids an input should point at with `aria-describedby`.
export function describedByIds(id: string, { description, error, hint }: Pick<FieldShellProps, 'description' | 'error' | 'hint'>) {
  const ids = [
    description === undefined ? null : `${id}-description`,
    hint === undefined ? null : `${id}-hint`,
    error === undefined ? null : `${id}-error`,
  ];
  const joined = ids.filter((value) => value !== null).join(' ');
  return joined === '' ? undefined : joined;
}

// Label, input, help text and error in the same arrangement for every field.
export function FieldShell({ id, label, description, isRequired = false, error, hint, children }: FieldShellProps) {
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
        {isRequired && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLabel>
      {children}
      {description !== undefined && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      {hint !== undefined && (
        <div id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </div>
      )}
      {error !== undefined && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
