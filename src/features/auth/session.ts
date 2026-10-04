import 'server-only';

import { cache } from 'react';

import { apiRequest } from '@/lib/api/api-client';
import { ApiUnauthorizedError, ApiUnavailableError } from '@/lib/api/api-errors';
import { getSessionToken } from '@/lib/session/session-token';

import { adminSchema } from './schemas';

import type { Admin } from './schemas';

// The logged-in admin, checked by the backend once per request; an ended session redirects to the login page.
export const getCurrentAdmin = cache((): Promise<Admin> => apiRequest('/auth/me', { schema: adminSchema }));

// For the login page: whether the cookie still holds a valid session, without redirecting.
export async function hasValidSession(): Promise<boolean> {
  if ((await getSessionToken()) === null) {
    return false;
  }
  try {
    await apiRequest('/auth/me', { schema: adminSchema, shouldRedirectOnUnauthorized: false });
    return true;
  } catch (error) {
    // An unreachable backend shows the form; submitting it then explains the problem.
    if (error instanceof ApiUnauthorizedError || error instanceof ApiUnavailableError) {
      return false;
    }
    throw error;
  }
}
