import { describe, expect, it } from 'vitest';

import { changePasswordSchema } from '@/features/settings/schemas';

function errorsFor(values: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Record<string, string> {
  const result = changePasswordSchema.safeParse(values);
  return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]));
}

describe('changePasswordSchema', () => {
  it('sends only the current and the new password', () => {
    expect(
      changePasswordSchema.parse({
        currentPassword: 'old password 1',
        newPassword: 'a brand new pass',
        confirmNewPassword: 'a brand new pass',
      }),
    ).toEqual({ currentPassword: 'old password 1', newPassword: 'a brand new pass' });
  });

  it('requires at least 12 characters', () => {
    expect(errorsFor({ currentPassword: 'old', newPassword: 'short', confirmNewPassword: 'short' })).toEqual({
      newPassword: 'Use at least 12 characters',
    });
  });

  it('counts bytes, not characters, against the 72-byte limit', () => {
    const password = 'é'.repeat(37);

    expect(errorsFor({ currentPassword: 'old', newPassword: password, confirmNewPassword: password }).newPassword).toMatch(
      /at most 72 bytes/,
    );
  });

  it('refuses the current password and a confirmation that does not match', () => {
    expect(
      errorsFor({ currentPassword: 'same password 1', newPassword: 'same password 1', confirmNewPassword: 'same password 1' }),
    ).toEqual({
      newPassword: 'Choose a password different from the current one',
    });
    expect(errorsFor({ currentPassword: 'old', newPassword: 'a brand new pass', confirmNewPassword: 'a brand new pas' })).toEqual({
      confirmNewPassword: 'The two new passwords do not match',
    });
  });
});
