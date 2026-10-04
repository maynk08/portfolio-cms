import { get } from 'react-hook-form';

import type { ActionFailure } from '@/lib/actions/action-result';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

// Puts each server error next to its field and focuses the first; errors for fields the form does not have go on top.
export function applyFieldErrors<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, 'getValues' | 'setError'>,
  failure: ActionFailure,
): void {
  const values = form.getValues();
  const unmatched: string[] = [];
  let hasFocused = false;

  for (const [field, message] of Object.entries(failure.fieldErrors ?? {})) {
    if (get(values, field) === undefined) {
      unmatched.push(message);
      continue;
    }
    // The path comes from validating this form's own values, so it names one of its fields.
    form.setError(field as FieldPath<T>, { type: 'server', message }, { shouldFocus: !hasFocused });
    hasFocused = true;
  }

  const formError = failure.formError ?? unmatched[0];
  if (formError !== undefined) {
    form.setError('root.server', { type: 'server', message: formError });
  }
}
