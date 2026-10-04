'use client';

import { useState } from 'react';
import { useFormState } from 'react-hook-form';

import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { ActionFormState } from '@/components/forms/use-action-form';
import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

type FormDialogProps<TInput extends FieldValues, TOutput extends FieldValues> = {
  actionForm: ActionFormState<TInput, TOutput>;
  title: string;
  description?: string;
  submitLabel?: string;
  // Called to close the dialog; render the dialog only while it is open, so each opening starts fresh.
  onClose: () => void;
  children: ReactNode;
};

// A short form in a dialog. Closing it with unsaved changes asks first (the only allowed stacked dialog).
export function FormDialog<TInput extends FieldValues, TOutput extends FieldValues>({
  actionForm,
  title,
  description,
  submitLabel = 'Save',
  onClose,
  children,
}: FormDialogProps<TInput, TOutput>) {
  const { form, submit, isPending } = actionForm;
  const { isDirty, errors } = useFormState({ control: form.control });
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const formError = errors.root?.server?.message;

  const requestClose = (): void => {
    if (isPending) {
      return;
    }
    if (isDirty) {
      setIsConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) {
            requestClose();
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submit} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description !== undefined && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {formError !== undefined && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}
            {children}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={requestClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isConfirmingDiscard}
        onOpenChange={setIsConfirmingDiscard}
        title="Discard unsaved changes?"
        description="Your changes in this dialog will be lost."
        confirmLabel="Discard changes"
        onConfirm={() => Promise.resolve(undefined)}
        onSuccess={onClose}
      />
    </>
  );
}
