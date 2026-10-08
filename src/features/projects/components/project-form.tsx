'use client';

import { useRouter } from 'next/navigation';

import { ActionForm } from '@/components/forms/action-form';
import { FormSection } from '@/components/forms/form-section';
import { MarkdownField } from '@/components/forms/markdown-field';
import { MediaNote } from '@/components/forms/media-note';
import { SwitchField } from '@/components/forms/switch-field';
import { TagsField } from '@/components/forms/tags-field';
import { TextField } from '@/components/forms/text-field';
import { TextareaField } from '@/components/forms/textarea-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { createProject, updateProject } from '@/features/projects/actions';
import { PROJECT_LIMITS, projectFormSchema } from '@/features/projects/schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

import type { ProjectFormValues } from '@/features/projects/schemas';

const LIST_HREF = '/projects';

type ProjectFormProps = {
  // Absent when creating.
  id?: string;
  initialValues: ProjectFormValues;
};

export function ProjectForm({ id, initialValues }: ProjectFormProps) {
  const router = useRouter();
  const isCreating = id === undefined;
  const actionForm = useActionForm({
    schema: projectFormSchema(isCreating ? 'create' : 'edit'),
    defaultValues: initialValues,
    action: (values) => (id === undefined ? createProject(values) : updateProject(id, values)),
    onSuccess: () => {
      if (isCreating) {
        router.push(LIST_HREF);
      }
    },
  });
  const { control } = actionForm.form;

  return (
    <ActionForm
      actionForm={actionForm}
      secondaryAction={{ type: 'cancel', href: LIST_HREF }}
      submitLabel={isCreating ? 'Create project' : 'Save project'}
    >
      <FormSection title="Project">
        <TextField control={control} name="title" label="Title" isRequired />
        <TextField
          control={control}
          name="slug"
          label="Slug"
          description={
            isCreating
              ? 'The end of the project’s address, /projects/<slug>. Leave empty to make one from the title.'
              : 'The end of the project’s address, /projects/<slug>. Changing it breaks links that were already shared.'
          }
          placeholder="my-project"
          isRequired={!isCreating}
        />
        <TextareaField
          control={control}
          name="summary"
          label="Summary"
          description="One or two sentences for the project card."
          maxLength={TEXT_LIMITS.summary}
          rows={2}
        />
        <TextField control={control} name="role" label="Your role" placeholder="Solo developer" />
        <MarkdownField control={control} name="description" label="Description" maxLength={TEXT_LIMITS.markdown} />
        <TagsField control={control} name="techStack" label="Tech stack" maxItems={PROJECT_LIMITS.techStack} placeholder="Next.js" />
      </FormSection>
      <FormSection title="Links">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField control={control} name="liveUrl" label="Live site" type="url" placeholder="https://" />
          <TextField control={control} name="repoUrl" label="Source code" type="url" placeholder="https://github.com/…" />
        </div>
      </FormSection>
      <FormSection title="Images">
        <MediaNote
          items={[
            { label: 'Cover image', isSet: initialValues.coverImage !== null },
            { label: 'Gallery', isSet: initialValues.gallery.length > 0 },
          ]}
        />
      </FormSection>
      <FormSection title="Visibility">
        <SwitchField control={control} name="isFeatured" label="Feature this project on the home page" />
        <SwitchField control={control} name="isVisible" label="Show this project on the portfolio" />
      </FormSection>
    </ActionForm>
  );
}
