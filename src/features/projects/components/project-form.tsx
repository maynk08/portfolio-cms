'use client';

import { useRouter } from 'next/navigation';

import { ActionForm } from '@/components/forms/action-form';
import { FormSection } from '@/components/forms/form-section';
import { MarkdownField } from '@/components/forms/markdown-field';
import { SwitchField } from '@/components/forms/switch-field';
import { TagsField } from '@/components/forms/tags-field';
import { TextField } from '@/components/forms/text-field';
import { TextareaField } from '@/components/forms/textarea-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { MediaField } from '@/features/media/components/media-field';
import { MediaGalleryField } from '@/features/media/components/media-gallery-field';
import { createProject, updateProject } from '@/features/projects/actions';
import { PROJECT_LIMITS, projectFormSchema } from '@/features/projects/schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

import type { Media } from '@/features/media/schemas';
import type { ProjectFormValues } from '@/features/projects/schemas';

const LIST_HREF = '/projects';

type ProjectFormProps = {
  // Absent when creating.
  id?: string;
  initialValues: ProjectFormValues;
  // Files the project already refers to, for their previews.
  knownMedia: Record<string, Media>;
};

export function ProjectForm({ id, initialValues, knownMedia }: ProjectFormProps) {
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
        <MediaField
          control={control}
          name="coverImage"
          label="Cover image"
          kind="image"
          knownMedia={knownMedia}
          description="Shown on the project card."
        />
        <MediaGalleryField
          control={control}
          name="gallery"
          label="Gallery"
          description="Screenshots on the project page, in this order."
          maxItems={PROJECT_LIMITS.gallery}
          knownMedia={knownMedia}
        />
      </FormSection>
      <FormSection title="Visibility">
        <SwitchField control={control} name="isFeatured" label="Feature this project on the home page" />
        <SwitchField control={control} name="isVisible" label="Show this project on the portfolio" />
      </FormSection>
    </ActionForm>
  );
}
