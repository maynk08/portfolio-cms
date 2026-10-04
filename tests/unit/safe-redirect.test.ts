import { describe, expect, it } from 'vitest';

import { getSafeRedirectPath } from '@/features/auth/safe-redirect';

describe('getSafeRedirectPath', () => {
  it.each(['/projects', '/projects/abc?tab=gallery', '/'])('keeps the same-site path %s', (path) => {
    expect(getSafeRedirectPath(path)).toBe(path);
  });

  it.each([
    ['another site', 'https://evil.example.com'],
    ['a protocol-relative URL', '//evil.example.com'],
    ['a backslash trick', '/\\evil.example.com'],
    ['a relative path', 'projects'],
    ['the login page itself', '/login?next=/projects'],
    ['an empty value', ''],
    ['a missing value', null],
    ['a non-string', ['/projects']],
  ])('falls back to the dashboard for %s', (_case, next) => {
    expect(getSafeRedirectPath(next)).toBe('/');
  });
});
