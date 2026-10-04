'use client';

import { useFormState } from 'react-hook-form';

import { FormActions } from '@/components/forms/form-actions';
import { useUnsavedChangesWarning } from '@/components/navigation/unsaved-changes';

import type { ActionFormState } from '@/components/forms/use-action-form';
import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

type ActionFormProps<TInput extends FieldValues, TOutput extends FieldValues> = {
  actionForm: ActionFormState<TInput, TOutput>;
  // Where Cancel goes, usually the list.
  cancelHref: string;
  submitLabel?: string;
  children: ReactNode;
};

// The frame of every form page: an error summary on top, the fields, and the sticky Cancel / Save bar.
export function ActionForm<TInput extends FieldValues, TOutput extends FieldValues>({
  actionForm,
  cancelHref,
  submitLabel = 'Save',
  children,
}: ActionFormProps<TInput, TOutput>) {
  const { form, submit, isPending } = actionForm;
  const { isDirty, errors } = useFormState({ control: form.control });
  useUnsavedChangesWarning(isDirty && !isPending);
  const formError = errors.root?.server?.message;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {formError !== undefined && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">with an asterisk</span> are required.
      </p>
      <div className="flex flex-col gap-6">{children}</div>
      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} isPending={isPending} hasUnsavedChanges={isDirty} />
    </form>
  );
}
