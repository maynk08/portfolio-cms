import { describeRetryWait, toActionFailure } from '@/lib/actions/action-result';
import { ApiRateLimitError, ApiUnauthorizedError } from '@/lib/api/api-errors';

import type { ActionFailure } from '@/lib/actions/action-result';

// Login words wrong details and rate limiting its own way; everything else uses the standard mapping.
export function toLoginFailure(error: unknown): ActionFailure {
  if (error instanceof ApiUnauthorizedError) {
    return { ok: false, formError: 'Email or password is incorrect.' };
  }
  if (error instanceof ApiRateLimitError) {
    return { ok: false, formError: `Too many login attempts. ${describeRetryWait(error.retryAfterSeconds)}` };
  }
  return toActionFailure(error);
}
