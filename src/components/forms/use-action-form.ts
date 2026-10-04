'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { unstable_rethrow } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { notifySuccess } from '@/components/feedback/notify';
import { applyFieldErrors } from '@/components/forms/apply-field-errors';
import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';

import type { ActionResult, ActionSuccess } from '@/lib/actions/action-result';
import type { SyntheticEvent } from 'react';
import type { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

type UseActionFormOptions<TInput extends FieldValues, TOutput extends FieldValues, TData> = {
  // Shared with the Server Action, which validates again.
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: DefaultValues<TInput>;
  action: (values: TOutput) => Promise<ActionResult<TData>>;
  // Runs after the success toast, e.g. to go back to the list after creating an item.
  onSuccess?: (result: ActionSuccess<TData>) => void;
};

export interface ActionFormState<TInput extends FieldValues, TOutput extends FieldValues> {
  form: UseFormReturn<TInput, unknown, TOutput>;
  submit: (event: SyntheticEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

/**
 * One way to run every CMS form: validate on blur (then on every change once a field shows an error), send the
 * values to a Server Action, put its errors next to the fields, and on success show a toast and mark the form saved.
 */
export function useActionForm<TInput extends FieldValues, TOutput extends FieldValues, TData = null>({
  schema,
  defaultValues,
  action,
  onSuccess,
}: UseActionFormOptions<TInput, TOutput, TData>): ActionFormState<TInput, TOutput> {
  const [isPending, startTransition] = useTransition();
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues,
  });

  const submitValues = (values: TOutput): void => {
    startTransition(async () => {
      let result: ActionResult<TData>;
      try {
        result = await action(values);
      } catch (error) {
        unstable_rethrow(error);
        form.setError('root.server', { type: 'server', message: GENERIC_ERROR_MESSAGE });
        return;
      }
      if (!result.ok) {
        applyFieldErrors(form, result);
        return;
      }
      notifySuccess(result.message);
      // The saved values become the new starting point, so the form is no longer "unsaved".
      form.reset(form.getValues());
      onSuccess?.(result);
    });
  };

  return {
    form,
    isPending,
    submit: (event) => {
      void form.handleSubmit(submitValues)(event);
    },
  };
}
