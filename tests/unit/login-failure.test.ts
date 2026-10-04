import { describe, expect, it } from 'vitest';

import { toLoginFailure } from '@/features/auth/login-failure';
import { ApiError, ApiRateLimitError, ApiUnauthorizedError, ApiUnavailableError, ApiValidationError } from '@/lib/api/api-errors';

describe('toLoginFailure', () => {
  it('explains wrong credentials without saying which one is wrong', () => {
    expect(toLoginFailure(new ApiUnauthorizedError('Invalid email or password'))).toEqual({
      ok: false,
      formError: 'Email or password is incorrect.',
    });
  });

  it.each([
    [900, 'Try again in 15 minutes.'],
    [30, 'Try again in 1 minute.'],
    [null, 'Try again later.'],
  ])('tells how long to wait after too many attempts (%s seconds)', (retryAfter, expected) => {
    expect(toLoginFailure(new ApiRateLimitError('Too many', retryAfter)).formError).toBe(`Too many login attempts. ${expected}`);
  });

  it('puts backend field errors next to the fields', () => {
    const error = new ApiValidationError('Validation failed', [
      { field: 'email', message: 'Enter a valid email address' },
      { field: 'email', message: 'Second message is ignored' },
    ]);

    expect(toLoginFailure(error)).toEqual({ ok: false, fieldErrors: { email: 'Enter a valid email address' } });
  });

  it('shows a validation error without field errors as a form error', () => {
    expect(toLoginFailure(new ApiValidationError('Validation failed', []))).toEqual({ ok: false, formError: 'Validation failed' });
  });

  it('points at the backend when it cannot be reached', () => {
    expect(toLoginFailure(new ApiUnavailableError()).formError).toMatch(/Can’t reach the server/);
  });

  it('gives a generic message for other API errors', () => {
    expect(toLoginFailure(new ApiError(500, 'Internal server error')).formError).toBe('Something went wrong. Try again.');
  });

  it('rethrows errors that are not API errors', () => {
    const bug = new TypeError('bug');

    expect(() => toLoginFailure(bug)).toThrow(bug);
  });
});
