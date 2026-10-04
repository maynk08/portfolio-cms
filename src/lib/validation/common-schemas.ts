import { z } from 'zod';

import { TEXT_LIMITS, maxLengthMessage } from './text-limits';

const EMAIL_EXAMPLE = 'Enter an email address, like name@example.com';
export const URL_MESSAGE = 'Enter a full URL starting with https://';

export function requiredText(max: number, message: string) {
  return z.string().trim().min(1, message).max(max, maxLengthMessage(max));
}

// Optional text: an empty field is saved as null.
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, maxLengthMessage(max))
    .transform((value) => (value === '' ? null : value));
}

export function isEmailAddress(value: string): boolean {
  return z.email().safeParse(value).success;
}

export function isHttpUrl(value: string): boolean {
  return z.url({ protocol: /^https?$/ }).safeParse(value).success;
}

export const optionalEmailSchema = z
  .string()
  .trim()
  .max(TEXT_LIMITS.url, maxLengthMessage(TEXT_LIMITS.url))
  .refine((value) => value === '' || isEmailAddress(value), EMAIL_EXAMPLE)
  .transform((value) => (value === '' ? null : value.toLowerCase()));

export { EMAIL_EXAMPLE };
