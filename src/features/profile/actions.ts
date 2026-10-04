'use server';

import { runAction, toValidationFailure } from '@/lib/actions/action-result';
import { apiRequest } from '@/lib/api/api-client';

import { profileFormSchema, profileResponseSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

// Replaces the whole profile; the form always sends every field, including the unchanged photo and résumé.
export async function saveProfile(values: unknown): Promise<ActionResult> {
  const input = profileFormSchema.safeParse(values);
  if (!input.success) {
    return toValidationFailure(input.error);
  }
  return runAction(async () => {
    await apiRequest('/profile', { method: 'PUT', body: input.data, schema: profileResponseSchema });
    return null;
  }, 'Profile saved');
}
