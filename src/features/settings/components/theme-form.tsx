'use client';

import { ActionForm } from '@/components/forms/action-form';
import { RadioGroupField } from '@/components/forms/radio-group-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { saveSettings } from '@/features/settings/actions';
import { settingsSchema } from '@/features/settings/schemas';

import type { SettingsValues } from '@/features/settings/schemas';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark', description: 'The default, designed first.' },
  { value: 'light', label: 'Light', description: 'A light version with the same layout.' },
];

export function ThemeForm({ initialValues }: { initialValues: SettingsValues }) {
  const actionForm = useActionForm({ schema: settingsSchema, defaultValues: initialValues, action: saveSettings });

  return (
    <ActionForm
      actionForm={actionForm}
      variant="card"
      secondaryAction={{ type: 'none' }}
      submitLabel="Save theme"
      hasRequiredFields={false}
    >
      <RadioGroupField
        control={actionForm.form.control}
        name="theme"
        label="Theme"
        description="Visitors see the portfolio in this theme; they cannot switch it."
        options={THEME_OPTIONS}
      />
    </ActionForm>
  );
}
