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

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const objectIdSchema = z.string().regex(OBJECT_ID_PATTERN);

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const yearMonthSchema = z.string().regex(YEAR_MONTH_PATTERN);

// Optional http(s) URL: an empty field is saved as null.
export const optionalUrlSchema = z
  .string()
  .trim()
  .max(TEXT_LIMITS.url, maxLengthMessage(TEXT_LIMITS.url))
  .refine((value) => value === '' || isHttpUrl(value), URL_MESSAGE)
  .transform((value) => (value === '' ? null : value));

// A list of short texts, each required: an empty entry has to be filled in or removed.
export function textListSchema(options: { maxItems: number; maxLength: number; emptyMessage: string; tooManyMessage: string }) {
  return z.array(requiredText(options.maxLength, options.emptyMessage)).max(options.maxItems, options.tooManyMessage);
}

// Media references are chosen in the media library (C5); until then forms carry them through unchanged.
export const mediaIdSchema = z.string().nullable();
