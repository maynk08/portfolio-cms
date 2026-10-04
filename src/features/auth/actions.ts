'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { apiRequest } from '@/lib/api/api-client';
import { ApiUnauthorizedError, ApiUnavailableError } from '@/lib/api/api-errors';
import { loginPathFor } from '@/lib/session/login-paths';
import { clearSessionToken, setSessionToken } from '@/lib/session/session-token';

import { getClientIp } from './client-ip';
import { toLoginFailure } from './login-failure';
import { getSafeRedirectPath } from './safe-redirect';
import { loginResultSchema, loginSchema } from './schemas';

import type { LoginFailure } from './login-failure';

// Returns what went wrong; on success it sets the session cookie and redirects, so it never returns.
export async function login(values: unknown, next: unknown): Promise<LoginFailure> {
  const input = loginSchema.safeParse(values);
  if (!input.success) {
    const { fieldErrors } = z.flattenError(input.error);
    return { fieldErrors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] } };
  }

  const clientIp = await getClientIp();
  let result;
  try {
    result = await apiRequest('/auth/login', {
      method: 'POST',
      body: input.data,
      schema: loginResultSchema,
      isAuthenticated: false,
      headers: clientIp === null ? undefined : { 'X-Forwarded-For': clientIp },
    });
  } catch (error) {
    return toLoginFailure(error);
  }

  await setSessionToken(result.token, result.expiresAt);
  redirect(getSafeRedirectPath(next));
}

// Ends the session on the backend (which ends every session) and here. Not destructive, so no confirmation.
export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST', schema: z.null(), shouldRedirectOnUnauthorized: false });
  } catch (error) {
    // Already ended, or the backend is down: the local session is cleared either way.
    if (!(error instanceof ApiUnauthorizedError || error instanceof ApiUnavailableError)) {
      throw error;
    }
  }
  await clearSessionToken();
  redirect(loginPathFor('logged-out'));
}
