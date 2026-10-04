export const LOGIN_PATH = '/login';

// Why the login page was opened; it shows a matching notice.
export const LOGIN_REASONS = ['expired', 'logged-out'] as const;

export type LoginReason = (typeof LOGIN_REASONS)[number];

export function loginPathFor(reason: LoginReason): string {
  return `${LOGIN_PATH}?reason=${reason}`;
}
