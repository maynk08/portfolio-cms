import { LOGIN_PATH } from '@/lib/session/login-paths';

export const DEFAULT_REDIRECT_PATH = '/';

// Only same-site paths are followed after login: "/projects" yes; "//evil.com", "/\\evil.com" or "https://..." no.
export function getSafeRedirectPath(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || next.startsWith(LOGIN_PATH)) {
    return DEFAULT_REDIRECT_PATH;
  }
  return next;
}
