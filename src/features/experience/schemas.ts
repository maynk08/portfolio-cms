import { z } from 'zod';

import { mediaIdSchema, optionalText, optionalUrlSchema, requiredText, textListSchema } from '@/lib/validation/common-schemas';
import { EMPTY_DATE_RANGE, checkDateRange, dateRangeFields, toDateRangeValues, toSavedRange } from '@/lib/validation/date-range';
import { TEXT_LIMITS, maxLengthMessage } from '@/lib/validation/text-limits';

export const EXPERIENCE_PATH = '/experiences';
export const EXPERIENCE_LIMITS = { highlights: 20, techStack: 30 } as const;

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().nullish(),
  startDate: z.string(),
  endDate: z.string().nullish(),
  summary: z.string().nullish(),
  highlights: z.array(z.string()),
  techStack: z.array(z.string()),
  companyLogo: z.string().nullish(),
  companyUrl: z.string().nullish(),
  isVisible: z.boolean(),
});

export type Experience = z.infer<typeof experienceSchema>;

export function describeExperience(experience: { role: string; company: string }): string {
  return `${experience.role} at ${experience.company}`;
}

export const experienceFormSchema = z
  .object({
    company: requiredText(TEXT_LIMITS.name, 'Enter the company'),
    role: requiredText(TEXT_LIMITS.name, 'Enter your role'),
    location: optionalText(TEXT_LIMITS.name),
    ...dateRangeFields,
    summary: optionalText(TEXT_LIMITS.summary),
    highlights: textListSchema({
      maxItems: EXPERIENCE_LIMITS.highlights,
      maxLength: TEXT_LIMITS.listItem,
      emptyMessage: 'Write the highlight or remove it',
      tooManyMessage: `Add at most ${EXPERIENCE_LIMITS.highlights} highlights`,
    }),
    techStack: z
      .array(z.string().trim().min(1).max(TEXT_LIMITS.tag, maxLengthMessage(TEXT_LIMITS.tag)))
      .max(EXPERIENCE_LIMITS.techStack, `Add at most ${EXPERIENCE_LIMITS.techStack} technologies`),
    companyLogo: mediaIdSchema,
    companyUrl: optionalUrlSchema,
    isVisible: z.boolean(),
  })
  .superRefine((values, context) => {
    checkDateRange(values, context, {
      missingStart: 'Pick the month you started',
      missingEnd: 'Pick the month you left, or tick “I currently work here”',
    });
  })
  .transform(({ startDate, endDate, isOngoing, ...rest }) => {
    const range = toSavedRange({ startDate, endDate, isOngoing });
    return { ...rest, startDate: range.start, endDate: range.end };
  });

export type ExperienceFormValues = z.input<typeof experienceFormSchema>;

export const EMPTY_EXPERIENCE: ExperienceFormValues = {
  company: '',
  role: '',
  location: '',
  ...EMPTY_DATE_RANGE,
  summary: '',
  highlights: [],
  techStack: [],
  companyLogo: null,
  companyUrl: '',
  isVisible: true,
};

export function toExperienceFormValues(experience: Experience): ExperienceFormValues {
  return {
    company: experience.company,
    role: experience.role,
    location: experience.location ?? '',
    ...toDateRangeValues(experience.startDate, experience.endDate),
    summary: experience.summary ?? '',
    highlights: experience.highlights,
    techStack: experience.techStack,
    companyLogo: experience.companyLogo ?? null,
    companyUrl: experience.companyUrl ?? '',
    isVisible: experience.isVisible,
  };
}
