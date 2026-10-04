import { z } from 'zod';

export const THEMES = ['dark', 'light'] as const;

export const settingsSchema = z.object({ theme: z.enum(THEMES) });

export type SettingsValues = z.infer<typeof settingsSchema>;

const MIN_PASSWORD_LENGTH = 12;
// bcrypt ignores everything after 72 bytes, so the backend refuses longer passwords.
const MAX_PASSWORD_BYTES = 72;

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

// The same rules as the backend; the output is the body of `PATCH /auth/password`.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
      .refine(
        (password) => byteLength(password) <= MAX_PASSWORD_BYTES,
        'Use a shorter password (at most 72 bytes; some symbols count as several)',
      ),
    confirmNewPassword: z.string().min(1, 'Enter the new password again'),
  })
  .superRefine((values, context) => {
    if (values.newPassword !== '' && values.newPassword === values.currentPassword) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Choose a password different from the current one' });
    }
    if (values.confirmNewPassword !== '' && values.confirmNewPassword !== values.newPassword) {
      context.addIssue({ code: 'custom', path: ['confirmNewPassword'], message: 'The two new passwords do not match' });
    }
  })
  .transform(({ currentPassword, newPassword }) => ({ currentPassword, newPassword }));

export type ChangePasswordValues = z.input<typeof changePasswordSchema>;

export const EMPTY_PASSWORD_VALUES: ChangePasswordValues = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

export const issuedTokenSchema = z.object({ token: z.string().min(1), expiresAt: z.coerce.date() });
