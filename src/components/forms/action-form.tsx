'use client';

import { useState } from 'react';
import { useFormState } from 'react-hook-form';

import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { FormActions } from '@/components/forms/form-actions';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { useUnsavedChangesWarning } from '@/components/navigation/unsaved-changes';
import { Button } from '@/components/ui/button';

import type { ActionFormState } from '@/components/forms/use-action-form';
import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

// Forms backed by a list go back to it; edit-in-place forms (profile, settings) reset to the last saved values instead.
export type SecondaryAction = { type: 'cancel'; href: string } | { type: 'discard' } | { type: 'none' };

type ActionFormProps<TInput extends FieldValues, TOutput extends FieldValues> = {
  actionForm: ActionFormState<TInput, TOutput>;
  secondaryAction: SecondaryAction;
  submitLabel?: string;
  // `page`: the sticky bar at the bottom of the screen. `card`: a footer inside a card, for pages with several small forms.
  variant?: 'page' | 'card';
  hasRequiredFields?: boolean;
  children: ReactNode;
};

// The frame of every form: an error summary on top, the fields, and Save (with Cancel or Discard changes) at the bottom.
export function ActionForm<TInput extends FieldValues, TOutput extends FieldValues>({
  actionForm,
  secondaryAction,
  submitLabel = 'Save',
  variant = 'page',
  hasRequiredFields = true,
  children,
}: ActionFormProps<TInput, TOutput>) {
  const { form, submit, isPending } = actionForm;
  const { isDirty, errors } = useFormState({ control: form.control });
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  useUnsavedChangesWarning(isDirty && !isPending);
  const formError = errors.root?.server?.message;

  const secondaryButton =
    secondaryAction.type === 'cancel' ? (
      <Button variant="outline" asChild>
        <GuardedLink href={secondaryAction.href}>Cancel</GuardedLink>
      </Button>
    ) : secondaryAction.type === 'discard' ? (
      <Button
        type="button"
        variant="outline"
        disabled={!isDirty || isPending}
        onClick={() => {
          setIsConfirmingDiscard(true);
        }}
      >
        Discard changes
      </Button>
    ) : null;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {formError !== undefined && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      {hasRequiredFields && (
        <p className="text-sm text-muted-foreground">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required.
        </p>
      )}
      <div className="flex flex-col gap-6">{children}</div>
      <FormActions
        placement={variant === 'page' ? 'sticky' : 'card'}
        hasUnsavedChanges={isDirty}
        secondaryAction={secondaryButton}
        submitButton={
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : submitLabel}
          </Button>
        }
      />
      {secondaryAction.type === 'discard' && (
        <ConfirmDialog
          open={isConfirmingDiscard}
          onOpenChange={setIsConfirmingDiscard}
          title="Discard unsaved changes?"
          description="The form goes back to the last saved version. Your changes will be lost."
          confirmLabel="Discard changes"
          onConfirm={() => {
            form.reset();
            return Promise.resolve(undefined);
          }}
        />
      )}
    </form>
  );
}
