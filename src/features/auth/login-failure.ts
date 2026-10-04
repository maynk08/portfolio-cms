import { ApiError, ApiRateLimitError, ApiUnauthorizedError, ApiUnavailableError, ApiValidationError } from '@/lib/api/api-errors';

import type { LoginInput } from './schemas';

const SECONDS_PER_MINUTE = 60;

export interface LoginFailure {
  formError?: string;
  fieldErrors?: Partial<Record<keyof LoginInput, string>>;
}

function isLoginField(field: string): field is keyof LoginInput {
  return field === 'email' || field === 'password';
}

function describeWait(retryAfterSeconds: number | null): string {
  if (retryAfterSeconds === null) {
    return 'Try again later.';
  }
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / SECONDS_PER_MINUTE));
  return `Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
}

// Turns a failed login call into text for the form. Anything that is not an API error is a bug and is rethrown.
export function toLoginFailure(error: unknown): LoginFailure {
  if (error instanceof ApiUnauthorizedError) {
    return { formError: 'Email or password is incorrect.' };
  }
  if (error instanceof ApiRateLimitError) {
    return { formError: `Too many login attempts. ${describeWait(error.retryAfterSeconds)}` };
  }
  if (error instanceof ApiValidationError) {
    const fieldErrors: LoginFailure['fieldErrors'] = {};
    for (const { field, message } of error.fieldErrors) {
      if (isLoginField(field)) {
        fieldErrors[field] ??= message;
      }
    }
    return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : { formError: error.message };
  }
  if (error instanceof ApiUnavailableError) {
    return { formError: 'Can’t reach the server. Check that the backend is running, then try again.' };
  }
  if (error instanceof ApiError) {
    return { formError: 'Something went wrong while logging in. Try again.' };
  }
  throw error;
}
