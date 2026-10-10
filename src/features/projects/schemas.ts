import { z } from 'zod';

import { mediaIdSchema, optionalText, optionalUrlSchema, requiredText } from '@/lib/validation/common-schemas';
import { TEXT_LIMITS, maxLengthMessage } from '@/lib/validation/text-limits';

export const PROJECTS_PATH = '/projects';
export const PROJECT_LIMITS = { techStack: 30, slugLength: 80, gallery: 20 } as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = 'Use lowercase letters, numbers and single hyphens, like my-project';

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullish(),
  description: z.string().nullish(),
  role: z.string().nullish(),
  techStack: z.array(z.string()),
  liveUrl: z.string().nullish(),
  repoUrl: z.string().nullish(),
  coverImage: z.string().nullish(),
  gallery: z.array(z.string()),
  isFeatured: z.boolean(),
  isVisible: z.boolean(),
});

export type Project = z.infer<typeof projectSchema>;

const slugText = z.string().trim().max(PROJECT_LIMITS.slugLength, maxLengthMessage(PROJECT_LIMITS.slugLength));

// On create an empty slug is left out, so the backend makes one from the title; on edit it is required.
export function projectFormSchema(mode: 'create' | 'edit') {
  const slug =
    mode === 'create'
      ? slugText
          .refine((value) => value === '' || SLUG_PATTERN.test(value), SLUG_MESSAGE)
          .transform((value) => (value === '' ? undefined : value))
      : slugText.min(1, 'Enter a slug').refine((value) => value === '' || SLUG_PATTERN.test(value), SLUG_MESSAGE);

  return z.object({
    title: requiredText(TEXT_LIMITS.title, 'Enter the project title'),
    slug,
    summary: optionalText(TEXT_LIMITS.summary),
    role: optionalText(TEXT_LIMITS.name),
    description: optionalText(TEXT_LIMITS.markdown),
    techStack: z
      .array(z.string().trim().min(1).max(TEXT_LIMITS.tag, maxLengthMessage(TEXT_LIMITS.tag)))
      .max(PROJECT_LIMITS.techStack, `Add at most ${PROJECT_LIMITS.techStack} technologies`),
    liveUrl: optionalUrlSchema,
    repoUrl: optionalUrlSchema,
    coverImage: mediaIdSchema,
    gallery: z.array(z.string()).max(PROJECT_LIMITS.gallery, `Add at most ${PROJECT_LIMITS.gallery} images`),
    isFeatured: z.boolean(),
    isVisible: z.boolean(),
  });
}

export type ProjectFormValues = z.input<ReturnType<typeof projectFormSchema>>;

export const EMPTY_PROJECT: ProjectFormValues = {
  title: '',
  slug: '',
  summary: '',
  role: '',
  description: '',
  techStack: [],
  liveUrl: '',
  repoUrl: '',
  coverImage: null,
  gallery: [],
  isFeatured: false,
  isVisible: true,
};

export function toProjectFormValues(project: Project): ProjectFormValues {
  return {
    title: project.title,
    slug: project.slug,
    summary: project.summary ?? '',
    role: project.role ?? '',
    description: project.description ?? '',
    techStack: project.techStack,
    liveUrl: project.liveUrl ?? '',
    repoUrl: project.repoUrl ?? '',
    coverImage: project.coverImage ?? null,
    gallery: project.gallery,
    isFeatured: project.isFeatured,
    isVisible: project.isVisible,
  };
}
