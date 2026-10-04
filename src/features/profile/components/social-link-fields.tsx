'use client';

import { useWatch } from 'react-hook-form';

import { SelectField } from '@/components/forms/select-field';
import { SwitchField } from '@/components/forms/switch-field';
import { TextField } from '@/components/forms/text-field';
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS } from '@/features/profile/schemas';

import type { ProfileFormValues, ProfilePayload } from '@/features/profile/schemas';
import type { Control } from 'react-hook-form';

const PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((platform) => ({ value: platform, label: SOCIAL_PLATFORM_LABELS[platform] }));

type SocialLinkFieldsProps = {
  control: Control<ProfileFormValues, unknown, ProfilePayload>;
  index: number;
};

// The platform decides what the address field asks for and whether a label is required.
export function SocialLinkFields({ control, index }: SocialLinkFieldsProps) {
  const platform = useWatch({ control, name: `socialLinks.${index}.platform` });
  const isEmail = platform === 'email';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField control={control} name={`socialLinks.${index}.platform`} label="Platform" options={PLATFORM_OPTIONS} isRequired />
      <TextField
        control={control}
        name={`socialLinks.${index}.label`}
        label="Label"
        description={platform === 'other' ? 'Shown as the link text.' : 'Optional; shown instead of the platform name.'}
        isRequired={platform === 'other'}
      />
      <TextField
        control={control}
        name={`socialLinks.${index}.url`}
        label={isEmail ? 'Email address' : 'URL'}
        type={isEmail ? 'email' : 'url'}
        placeholder={isEmail ? 'name@example.com' : 'https://'}
        isRequired
      />
      <div className="flex items-end pb-1">
        <SwitchField control={control} name={`socialLinks.${index}.isVisible`} label={`Show link ${index + 1} on portfolio`} />
      </div>
    </div>
  );
}
