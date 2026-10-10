'use client';

import { useRouter } from 'next/navigation';

import { ActionForm } from '@/components/forms/action-form';
import { DateRangeFields } from '@/components/forms/date-range-fields';
import { FormSection } from '@/components/forms/form-section';
import { ListField } from '@/components/forms/list-field';
import { SwitchField } from '@/components/forms/switch-field';
import { TagsField } from '@/components/forms/tags-field';
import { TextField } from '@/components/forms/text-field';
import { TextareaField } from '@/components/forms/textarea-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { createExperience, updateExperience } from '@/features/experience/actions';
import { EXPERIENCE_LIMITS, experienceFormSchema } from '@/features/experience/schemas';
import { MediaField } from '@/features/media/components/media-field';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

import type { ExperienceFormValues } from '@/features/experience/schemas';
import type { Media } from '@/features/media/schemas';

const LIST_HREF = '/experience';

type ExperienceFormProps = {
  // Absent when creating.
  id?: string;
  initialValues: ExperienceFormValues;
  // Files the item already refers to, for their previews.
  knownMedia: Record<string, Media>;
};

export function ExperienceForm({ id, initialValues, knownMedia }: ExperienceFormProps) {
  const router = useRouter();
  const actionForm = useActionForm({
    schema: experienceFormSchema,
    defaultValues: initialValues,
    action: (values) => (id === undefined ? createExperience(values) : updateExperience(id, values)),
    onSuccess: () => {
      if (id === undefined) {
        router.push(LIST_HREF);
      }
    },
  });
  const { control } = actionForm.form;

  return (
    <ActionForm
      actionForm={actionForm}
      secondaryAction={{ type: 'cancel', href: LIST_HREF }}
      submitLabel={id === undefined ? 'Create experience' : 'Save experience'}
    >
      <FormSection title="Job">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField control={control} name="role" label="Role" isRequired />
          <TextField control={control} name="company" label="Company" isRequired />
          <TextField control={control} name="location" label="Location" placeholder="Berlin, Germany or Remote" />
          <TextField control={control} name="companyUrl" label="Company website" type="url" placeholder="https://" />
        </div>
        <DateRangeFields control={control} startLabel="Started" endLabel="Left" ongoingLabel="I currently work here" />
      </FormSection>
      <FormSection title="Details" description="Shown on the portfolio under the role.">
        <TextareaField control={control} name="summary" label="Summary" maxLength={TEXT_LIMITS.summary} rows={3} />
        <ListField
          control={control}
          name="highlights"
          label="Highlights"
          description="Achievements, one per line."
          itemNoun="highlight"
          maxItems={EXPERIENCE_LIMITS.highlights}
          isMultiline
        />
        <TagsField control={control} name="techStack" label="Tech stack" maxItems={EXPERIENCE_LIMITS.techStack} placeholder="TypeScript" />
      </FormSection>
      <FormSection title="Logo">
        <MediaField
          control={control}
          name="companyLogo"
          label="Company logo"
          kind="image"
          knownMedia={knownMedia}
          description="Shown next to the job."
        />
      </FormSection>
      <FormSection title="Visibility">
        <SwitchField control={control} name="isVisible" label="Show this job on the portfolio" />
      </FormSection>
    </ActionForm>
  );
}
