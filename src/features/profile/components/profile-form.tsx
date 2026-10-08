'use client';

import { ActionForm } from '@/components/forms/action-form';
import { FieldArrayGroup } from '@/components/forms/field-array-group';
import { FormSection } from '@/components/forms/form-section';
import { ListField } from '@/components/forms/list-field';
import { MarkdownField } from '@/components/forms/markdown-field';
import { MediaNote } from '@/components/forms/media-note';
import { NumberField } from '@/components/forms/number-field';
import { SwitchField } from '@/components/forms/switch-field';
import { TextField } from '@/components/forms/text-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { saveProfile } from '@/features/profile/actions';
import { SocialLinkFields } from '@/features/profile/components/social-link-fields';
import { PROFILE_LIMITS, emptyLanguage, emptySocialLink, profileFormSchema } from '@/features/profile/schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

import type { ProfileFormValues } from '@/features/profile/schemas';

type ProfileFormProps = {
  initialValues: ProfileFormValues;
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const actionForm = useActionForm({ schema: profileFormSchema, defaultValues: initialValues, action: saveProfile });
  const { control } = actionForm.form;

  return (
    <ActionForm actionForm={actionForm} secondaryAction={{ type: 'discard' }} submitLabel="Save profile">
      <FormSection title="Basics" description="Shown in the hero at the top of the portfolio.">
        <TextField control={control} name="name" label="Name" autoComplete="name" isRequired />
        <TextField control={control} name="headline" label="Headline" description="One line, such as “Full-stack engineer”." isRequired />
        <ListField
          control={control}
          name="heroPhrases"
          label="Typing phrases"
          description="Typed out one after another in the hero."
          itemNoun="phrase"
          maxItems={PROFILE_LIMITS.heroPhrases}
        />
      </FormSection>

      <FormSection title="About" description="The text of the About section.">
        <MarkdownField control={control} name="about" label="About you" maxLength={TEXT_LIMITS.markdown} />
      </FormSection>

      <FormSection title="Photo and résumé">
        <MediaNote
          items={[
            { label: 'Photo', isSet: initialValues.photo !== null },
            { label: 'Résumé (PDF)', isSet: initialValues.resume !== null },
          ]}
        />
      </FormSection>

      <FormSection title="Social links" description="Shown in the hero and the contact section, in this order.">
        <FieldArrayGroup
          control={control}
          name="socialLinks"
          label="Links"
          itemNoun="social link"
          maxItems={PROFILE_LIMITS.socialLinks}
          createItem={emptySocialLink}
          renderItem={(index) => <SocialLinkFields control={control} index={index} />}
        />
      </FormSection>

      <FormSection
        title="Optional details"
        description="Each detail appears on the portfolio only when its “Show … on portfolio” switch is on."
      >
        <div className="flex flex-col gap-3">
          <TextField control={control} name="location.value" label="Location" placeholder="Berlin, Germany" />
          <SwitchField control={control} name="location.isVisible" label="Show location on portfolio" />
        </div>
        <div className="flex flex-col gap-3">
          <TextField
            control={control}
            name="publicEmail.value"
            label="Public email"
            type="email"
            description="Shown in the contact section."
          />
          <SwitchField control={control} name="publicEmail.isVisible" label="Show public email on portfolio" />
        </div>
        <div className="flex flex-col gap-3">
          <SwitchField control={control} name="isOpenToWork.value" label="Open to work" description="Shows an “Open to work” badge." />
          <SwitchField control={control} name="isOpenToWork.isVisible" label="Show “Open to work” on portfolio" />
        </div>
        <div className="flex flex-col gap-3">
          <NumberField
            control={control}
            name="yearsOfExperience.value"
            label="Years of experience"
            min={0}
            max={PROFILE_LIMITS.yearsOfExperience}
          />
          <SwitchField control={control} name="yearsOfExperience.isVisible" label="Show years of experience on portfolio" />
        </div>
        <div className="flex flex-col gap-4">
          <SwitchField control={control} name="languages.isVisible" label="Show languages on portfolio" />
          <FieldArrayGroup
            control={control}
            name="languages.value"
            label="Languages"
            itemNoun="language"
            maxItems={PROFILE_LIMITS.languages}
            createItem={emptyLanguage}
            renderItem={(index) => (
              <div className="grid gap-4 md:grid-cols-2">
                <TextField control={control} name={`languages.value.${index}.name`} label="Language" isRequired />
                <TextField
                  control={control}
                  name={`languages.value.${index}.proficiency`}
                  label="Proficiency"
                  placeholder="Native, Fluent, Basic"
                />
              </div>
            )}
          />
        </div>
      </FormSection>
    </ActionForm>
  );
}
