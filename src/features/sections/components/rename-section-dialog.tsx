'use client';

import { FormDialog } from '@/components/forms/form-dialog';
import { TextField } from '@/components/forms/text-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { renameSection } from '@/features/sections/actions';
import { SECTION_DETAILS, renameSectionSchema } from '@/features/sections/schemas';

import type { Section } from '@/features/sections/schemas';

type RenameSectionDialogProps = {
  section: Section;
  onClose: () => void;
};

export function RenameSectionDialog({ section, onClose }: RenameSectionDialogProps) {
  const actionForm = useActionForm({
    schema: renameSectionSchema,
    defaultValues: { heading: section.heading },
    action: (values) => renameSection(section.key, values),
    onSuccess: onClose,
  });

  return (
    <FormDialog
      actionForm={actionForm}
      title={`Rename the ${SECTION_DETAILS[section.key].name} section`}
      description="The heading appears above the section and in the portfolio’s navigation."
      submitLabel="Rename"
      onClose={onClose}
    >
      <TextField control={actionForm.form.control} name="heading" label="Heading" isRequired />
    </FormDialog>
  );
}
