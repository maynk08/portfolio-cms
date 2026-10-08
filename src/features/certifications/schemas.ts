import { z } from 'zod';

import { mediaIdSchema, optionalText, optionalUrlSchema, requiredText } from '@/lib/validation/common-schemas';
import { EMPTY_DATE_RANGE, checkDateRange, dateRangeFields, toDateRangeValues, toSavedRange } from '@/lib/validation/date-range';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

export const CERTIFICATIONS_PATH = '/certifications';

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  expiryDate: z.string().nullish(),
  credentialId: z.string().nullish(),
  credentialUrl: z.string().nullish(),
  badge: z.string().nullish(),
  isVisible: z.boolean(),
});

export type Certification = z.infer<typeof certificationSchema>;

// Expired when the expiry month is before the current one (`YYYY-MM` strings compare as text).
export function isExpired(expiryDate: string | null | undefined, currentMonth: string): boolean {
  return expiryDate !== null && expiryDate !== undefined && expiryDate < currentMonth;
}

// The form uses the shared start / end / ongoing fields; they are saved as issue date / expiry date.
export const certificationFormSchema = z
  .object({
    name: requiredText(TEXT_LIMITS.title, 'Enter the certificate name'),
    issuer: requiredText(TEXT_LIMITS.name, 'Enter who issued it'),
    ...dateRangeFields,
    credentialId: optionalText(TEXT_LIMITS.name),
    credentialUrl: optionalUrlSchema,
    badge: mediaIdSchema,
    isVisible: z.boolean(),
  })
  .superRefine((values, context) => {
    checkDateRange(values, context, {
      missingStart: 'Pick the month it was issued',
      missingEnd: 'Pick the expiry month, or tick “Does not expire”',
    });
  })
  .transform(({ startDate, endDate, isOngoing, ...rest }) => {
    const range = toSavedRange({ startDate, endDate, isOngoing });
    return { ...rest, issueDate: range.start, expiryDate: range.end };
  });

export type CertificationFormValues = z.input<typeof certificationFormSchema>;

export const EMPTY_CERTIFICATION: CertificationFormValues = {
  name: '',
  issuer: '',
  ...EMPTY_DATE_RANGE,
  credentialId: '',
  credentialUrl: '',
  badge: null,
  isVisible: true,
};

export function toCertificationFormValues(certification: Certification): CertificationFormValues {
  return {
    name: certification.name,
    issuer: certification.issuer,
    ...toDateRangeValues(certification.issueDate, certification.expiryDate),
    credentialId: certification.credentialId ?? '',
    credentialUrl: certification.credentialUrl ?? '',
    badge: certification.badge ?? null,
    isVisible: certification.isVisible,
  };
}
