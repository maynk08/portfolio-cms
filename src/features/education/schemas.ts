import { z } from 'zod';

import { mediaIdSchema, optionalText, requiredText } from '@/lib/validation/common-schemas';
import { EMPTY_DATE_RANGE, checkDateRange, dateRangeFields, toDateRangeValues, toSavedRange } from '@/lib/validation/date-range';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

export const EDUCATION_PATH = '/education';

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().nullish(),
  startDate: z.string(),
  endDate: z.string().nullish(),
  grade: z.string().nullish(),
  description: z.string().nullish(),
  logo: z.string().nullish(),
  isVisible: z.boolean(),
});

export type Education = z.infer<typeof educationSchema>;

export function describeEducation(education: { degree: string; institution: string }): string {
  return `${education.degree}, ${education.institution}`;
}

export const educationFormSchema = z
  .object({
    institution: requiredText(TEXT_LIMITS.title, 'Enter the school or university'),
    degree: requiredText(TEXT_LIMITS.name, 'Enter the degree, such as "BSc"'),
    field: optionalText(TEXT_LIMITS.name),
    ...dateRangeFields,
    grade: optionalText(TEXT_LIMITS.tag),
    description: optionalText(TEXT_LIMITS.summary),
    logo: mediaIdSchema,
    isVisible: z.boolean(),
  })
  .superRefine((values, context) => {
    checkDateRange(values, context, {
      missingStart: 'Pick the month you started',
      missingEnd: 'Pick the month you finished, or tick “Still studying”',
    });
  })
  .transform(({ startDate, endDate, isOngoing, ...rest }) => {
    const range = toSavedRange({ startDate, endDate, isOngoing });
    return { ...rest, startDate: range.start, endDate: range.end };
  });

export type EducationFormValues = z.input<typeof educationFormSchema>;

export const EMPTY_EDUCATION: EducationFormValues = {
  institution: '',
  degree: '',
  field: '',
  ...EMPTY_DATE_RANGE,
  grade: '',
  description: '',
  logo: null,
  isVisible: true,
};

export function toEducationFormValues(education: Education): EducationFormValues {
  return {
    institution: education.institution,
    degree: education.degree,
    field: education.field ?? '',
    ...toDateRangeValues(education.startDate, education.endDate),
    grade: education.grade ?? '',
    description: education.description ?? '',
    logo: education.logo ?? null,
    isVisible: education.isVisible,
  };
}
