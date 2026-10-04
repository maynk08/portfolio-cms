'use client';

import { unstable_rethrow } from 'next/navigation';
import { useState, useTransition } from 'react';

import { notifySuccess } from '@/components/feedback/notify';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';

import type { ActionResult } from '@/lib/actions/action-result';
import type { ReactNode } from 'react';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Names the record and the action: `Delete project "Portfolio CMS"?`
  title: string;
  // The consequence: "Its 4 screenshots will be detached. This cannot be undone."
  description: ReactNode;
  // Names the action ("Delete"), never "OK" or "Yes".
  confirmLabel: string;
  pendingLabel?: string;
  isDestructive?: boolean;
  // Extra content between the description and the buttons, such as where a file is used.
  children?: ReactNode;
  // A failed result keeps the dialog open with its message; a successful one closes it and shows its message.
  onConfirm: () => Promise<ActionResult<unknown> | undefined>;
  onSuccess?: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Working…',
  isDestructive = true,
  children,
  onConfirm,
  onSuccess,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const changeOpen = (nextOpen: boolean): void => {
    if (isPending) {
      return;
    }
    setError(null);
    onOpenChange(nextOpen);
  };

  const confirm = (): void => {
    setError(null);
    startTransition(async () => {
      let result: ActionResult<unknown> | undefined;
      try {
        result = await onConfirm();
      } catch (thrown) {
        unstable_rethrow(thrown);
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }
      if (result?.ok === false) {
        setError(result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? GENERIC_ERROR_MESSAGE);
        return;
      }
      if (result?.ok === true) {
        notifySuccess(result.message);
      }
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {error !== null && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          {/* Radix focuses Cancel when the dialog opens, so Enter never confirms by accident. */}
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button variant={isDestructive ? 'destructive' : 'default'} disabled={isPending} onClick={confirm}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
