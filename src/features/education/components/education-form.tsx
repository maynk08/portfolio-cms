'use client';

import { useRouter } from 'next/navigation';

import { ActionForm } from '@/components/forms/action-form';
import { DateRangeFields } from '@/components/forms/date-range-fields';
import { FormSection } from '@/components/forms/form-section';
import { MediaNote } from '@/components/forms/media-note';
import { SwitchField } from '@/components/forms/switch-field';
import { TextField } from '@/components/forms/text-field';
import { TextareaField } from '@/components/forms/textarea-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { createEducation, updateEducation } from '@/features/education/actions';
import { educationFormSchema } from '@/features/education/schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

import type { EducationFormValues } from '@/features/education/schemas';

const LIST_HREF = '/education';

type EducationFormProps = {
  // Absent when creating.
  id?: string;
  initialValues: EducationFormValues;
};

export function EducationForm({ id, initialValues }: EducationFormProps) {
  const router = useRouter();
  const actionForm = useActionForm({
    schema: educationFormSchema,
    defaultValues: initialValues,
    action: (values) => (id === undefined ? createEducation(values) : updateEducation(id, values)),
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
      submitLabel={id === undefined ? 'Create education' : 'Save education'}
    >
      <FormSection title="Degree">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField control={control} name="degree" label="Degree" placeholder="BSc" isRequired />
          <TextField control={control} name="field" label="Field of study" placeholder="Computer Science" />
          <TextField control={control} name="institution" label="School or university" isRequired />
          <TextField control={control} name="grade" label="Grade" placeholder="First-class honours" />
        </div>
        <DateRangeFields control={control} startLabel="Started" endLabel="Finished" ongoingLabel="Still studying" />
        <TextareaField control={control} name="description" label="Description" maxLength={TEXT_LIMITS.summary} rows={3} />
      </FormSection>
      <FormSection title="Logo">
        <MediaNote items={[{ label: 'Logo', isSet: initialValues.logo !== null }]} />
      </FormSection>
      <FormSection title="Visibility">
        <SwitchField control={control} name="isVisible" label="Show this entry on the portfolio" />
      </FormSection>
    </ActionForm>
  );
}
