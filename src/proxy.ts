import { NextResponse } from 'next/server';

import { LOGIN_PATH } from '@/lib/session/login-paths';
import { SESSION_COOKIE_NAME } from '@/lib/session/session-cookie';

import type { NextRequest } from 'next/server';

/**
 * A quick check only: without a session cookie, go to the login page. Whether the session is valid is decided by
 * the backend on every data request.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  if (pathname === LOGIN_PATH || request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  if (pathname !== '/') {
    loginUrl.searchParams.set('next', `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next.js internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
