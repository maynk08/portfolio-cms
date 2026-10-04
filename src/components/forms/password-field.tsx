'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type PasswordFieldProps<T extends FieldValues, TTransformed extends FieldValues = T> = FormFieldProps<T, TTransformed> & {
  autoComplete: 'current-password' | 'new-password';
};

// A password input with a show/hide button.
export function PasswordField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  isRequired,
  autoComplete,
}: PasswordFieldProps<T, TTransformed>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const [isVisible, setIsVisible] = useState(false);
  const id = fieldId(name);
  const error = fieldState.error?.message;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error}>
      <div className="relative max-w-sm">
        <Input
          id={id}
          ref={ref}
          name={inputName}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-10"
          value={fieldValue ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error !== undefined}
          aria-required={isRequired}
          aria-describedby={describedByIds(id, { description, error })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          onClick={() => {
            setIsVisible((visible) => !visible);
          }}
        >
          {isVisible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
        </Button>
      </div>
    </FieldShell>
  );
}
