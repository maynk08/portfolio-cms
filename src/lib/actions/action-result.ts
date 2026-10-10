import { refresh } from 'next/cache';

import {
  ApiConflictError,
  ApiError,
  ApiNotFoundError,
  ApiRateLimitError,
  ApiUnavailableError,
  ApiValidationError,
} from '@/lib/api/api-errors';

import type { z } from 'zod';

export interface ActionSuccess<T = null> {
  ok: true;
  // Specific, shown in a toast: `Project "Portfolio CMS" saved`.
  message: string;
  data: T;
}

export interface ActionFailure {
  ok: false;
  // A problem with the whole request, shown above the form or in a toast.
  formError?: string;
  // Keyed by field path as the backend reports it (`title`, `gallery.2`).
  fieldErrors?: Record<string, string>;
}

// What every Server Action returns. Actions never redirect after a save: the client shows the toast, then navigates.
export type ActionResult<T = null> = ActionSuccess<T> | ActionFailure;

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Try again.';
export const UNAVAILABLE_MESSAGE = 'Can’t reach the server. Check that the backend is running, then try again.';

const SECONDS_PER_MINUTE = 60;

export function describeRetryWait(retryAfterSeconds: number | null): string {
  if (retryAfterSeconds === null) {
    return 'Try again later.';
  }
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / SECONDS_PER_MINUTE));
  return `Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
}

/**
 * Turns a failed backend call into text for the admin. Backend messages for 404, 409 and 422 are written for people,
 * so they are passed on; anything that is not an API error is a bug and is rethrown.
 */
export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof ApiValidationError) {
    const fieldErrors: Record<string, string> = {};
    for (const { field, message } of error.fieldErrors) {
      fieldErrors[field] ??= message;
    }
    return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: false, formError: error.message };
  }
  if (error instanceof ApiConflictError || error instanceof ApiNotFoundError) {
    return { ok: false, formError: error.message };
  }
  if (error instanceof ApiRateLimitError) {
    return { ok: false, formError: `Too many requests. ${describeRetryWait(error.retryAfterSeconds)}` };
  }
  if (error instanceof ApiUnavailableError) {
    return { ok: false, formError: UNAVAILABLE_MESSAGE };
  }
  if (error instanceof ApiError) {
    return { ok: false, formError: GENERIC_ERROR_MESSAGE };
  }
  throw error;
}

/**
 * Runs a backend write and reports it in the standard shape. On success it refreshes the current page in the same
 * response (`refresh()`), so lists and optimistic switches show the saved state without a second request.
 */
export async function runAction<T>(
  operation: () => Promise<T>,
  successMessage: string | ((data: T) => string),
  // Off for steps that change nothing on screen, such as asking for an upload form.
  options: { shouldRefresh?: boolean } = {},
): Promise<ActionResult<T>> {
  let data: T;
  try {
    data = await operation();
  } catch (error) {
    return toActionFailure(error);
  }
  if (options.shouldRefresh ?? true) {
    refresh();
  }
  return { ok: true, message: typeof successMessage === 'string' ? successMessage : successMessage(data), data };
}

// Server-side validation failures in the same shape as the backend's, keyed by field path.
export function toValidationFailure(error: z.ZodError): ActionFailure {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join('.');
    if (field === '') {
      return { ok: false, formError: issue.message };
    }
    fieldErrors[field] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}
