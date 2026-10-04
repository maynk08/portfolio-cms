import 'server-only';

import { cookies } from 'next/headers';

import { env } from '@/config/env';

import { SESSION_COOKIE_NAME } from './session-cookie';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

// Holds the backend's JWT as is: it is signed by the backend and never readable by page scripts.
export async function setSessionToken(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionToken(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
