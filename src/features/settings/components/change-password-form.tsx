'use client';

import { ActionForm } from '@/components/forms/action-form';
import { PasswordField } from '@/components/forms/password-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { changePassword } from '@/features/settings/actions';
import { EMPTY_PASSWORD_VALUES, changePasswordSchema } from '@/features/settings/schemas';

export function ChangePasswordForm() {
  const actionForm = useActionForm({
    schema: changePasswordSchema,
    defaultValues: EMPTY_PASSWORD_VALUES,
    action: changePassword,
    // Passwords never stay on screen after saving.
    resetAfterSuccess: 'initial-values',
  });
  const { control } = actionForm.form;

  return (
    <ActionForm actionForm={actionForm} variant="card" secondaryAction={{ type: 'none' }} submitLabel="Change password">
      <PasswordField control={control} name="currentPassword" label="Current password" autoComplete="current-password" isRequired />
      <PasswordField
        control={control}
        name="newPassword"
        label="New password"
        description="At least 12 characters."
        autoComplete="new-password"
        isRequired
      />
      <PasswordField control={control} name="confirmNewPassword" label="Confirm new password" autoComplete="new-password" isRequired />
    </ActionForm>
  );
}
