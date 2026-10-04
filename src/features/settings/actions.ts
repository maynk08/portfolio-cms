'use server';

import { runAction, toValidationFailure } from '@/lib/actions/action-result';
import { apiRequest } from '@/lib/api/api-client';
import { setSessionToken } from '@/lib/session/session-token';

import { changePasswordSchema, issuedTokenSchema, settingsSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

export async function saveSettings(values: unknown): Promise<ActionResult> {
  const input = settingsSchema.safeParse(values);
  if (!input.success) {
    return toValidationFailure(input.error);
  }
  return runAction(async () => {
    await apiRequest('/settings', { method: 'PUT', body: input.data, schema: settingsSchema });
    return null;
  }, `Portfolio theme set to ${input.data.theme}`);
}

// The backend ends every session when the password changes and returns a new token, which keeps this one going.
export async function changePassword(values: unknown): Promise<ActionResult> {
  const input = changePasswordSchema.safeParse(values);
  if (!input.success) {
    return toValidationFailure(input.error);
  }
  return runAction(async () => {
    const issued = await apiRequest('/auth/password', { method: 'PATCH', body: input.data, schema: issuedTokenSchema });
    await setSessionToken(issued.token, issued.expiresAt);
    return null;
  }, 'Password changed. Any other sessions have been logged out.');
}
