'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-hook-form';

import { ActionForm } from '@/components/forms/action-form';
import { TextareaField } from '@/components/forms/textarea-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { saveAltText } from '@/features/media/actions';
import { altTextFormSchema } from '@/features/media/schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

import type { RefObject } from 'react';

type AltTextFormProps = {
  mediaId: string;
  altText: string;
  // Lets the sheet ask before closing with unsaved alt text.
  hasUnsavedChangesRef: RefObject<boolean>;
};

export function AltTextForm({ mediaId, altText, hasUnsavedChangesRef }: AltTextFormProps) {
  const actionForm = useActionForm({
    schema: altTextFormSchema,
    defaultValues: { altText },
    action: (values) => saveAltText(mediaId, values),
  });
  const { isDirty } = useFormState({ control: actionForm.form.control });

  useEffect(() => {
    hasUnsavedChangesRef.current = isDirty;
  }, [hasUnsavedChangesRef, isDirty]);

  return (
    <ActionForm
      actionForm={actionForm}
      variant="card"
      secondaryAction={{ type: 'none' }}
      submitLabel="Save alt text"
      hasRequiredFields={false}
    >
      <TextareaField
        control={actionForm.form.control}
        name="altText"
        label="Alt text"
        description="Read out to people who cannot see the image. Describe what it shows, for example “Screenshot of the project dashboard”."
        maxLength={TEXT_LIMITS.listItem}
        rows={3}
      />
    </ActionForm>
  );
}
