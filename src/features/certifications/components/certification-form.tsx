'use client';

import { useRouter } from 'next/navigation';

import { ActionForm } from '@/components/forms/action-form';
import { DateRangeFields } from '@/components/forms/date-range-fields';
import { FormSection } from '@/components/forms/form-section';
import { MediaNote } from '@/components/forms/media-note';
import { SwitchField } from '@/components/forms/switch-field';
import { TextField } from '@/components/forms/text-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { createCertification, updateCertification } from '@/features/certifications/actions';
import { certificationFormSchema } from '@/features/certifications/schemas';

import type { CertificationFormValues } from '@/features/certifications/schemas';

const LIST_HREF = '/certifications';

type CertificationFormProps = {
  // Absent when creating.
  id?: string;
  initialValues: CertificationFormValues;
};

export function CertificationForm({ id, initialValues }: CertificationFormProps) {
  const router = useRouter();
  const actionForm = useActionForm({
    schema: certificationFormSchema,
    defaultValues: initialValues,
    action: (values) => (id === undefined ? createCertification(values) : updateCertification(id, values)),
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
      submitLabel={id === undefined ? 'Create certification' : 'Save certification'}
    >
      <FormSection title="Certificate">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField control={control} name="name" label="Name" isRequired />
          <TextField control={control} name="issuer" label="Issued by" placeholder="Amazon Web Services" isRequired />
          <TextField control={control} name="credentialId" label="Credential ID" />
          <TextField control={control} name="credentialUrl" label="Credential URL" type="url" placeholder="https://" />
        </div>
        <DateRangeFields control={control} startLabel="Issued" endLabel="Expires" ongoingLabel="Does not expire" />
      </FormSection>
      <FormSection title="Badge">
        <MediaNote items={[{ label: 'Badge image', isSet: initialValues.badge !== null }]} />
      </FormSection>
      <FormSection title="Visibility">
        <SwitchField control={control} name="isVisible" label="Show this certificate on the portfolio" />
      </FormSection>
    </ActionForm>
  );
}
