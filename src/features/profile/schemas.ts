import { z } from 'zod';

import {
  EMAIL_EXAMPLE,
  URL_MESSAGE,
  isEmailAddress,
  isHttpUrl,
  optionalEmailSchema,
  optionalText,
  requiredText,
} from '@/lib/validation/common-schemas';
import { TEXT_LIMITS, maxLengthMessage } from '@/lib/validation/text-limits';

export const SOCIAL_PLATFORMS = [
  'github',
  'linkedin',
  'x',
  'instagram',
  'youtube',
  'medium',
  'devto',
  'stackoverflow',
  'leetcode',
  'website',
  'email',
  'other',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  instagram: 'Instagram',
  youtube: 'YouTube',
  medium: 'Medium',
  devto: 'DEV',
  stackoverflow: 'Stack Overflow',
  leetcode: 'LeetCode',
  website: 'Website',
  email: 'Email',
  other: 'Other',
};

export const PROFILE_LIMITS = { heroPhrases: 10, socialLinks: 20, languages: 20, yearsOfExperience: 80 } as const;

const MAILTO_PREFIX = 'mailto:';

function toggleable<T extends z.ZodType>(value: T) {
  return z.object({ value, isVisible: z.boolean() });
}

// --- What the backend returns -------------------------------------------------------------------

const toggleableResponse = <T extends z.ZodType>(value: T) => z.object({ value: value.nullish(), isVisible: z.boolean() });

export const profileResponseSchema = z.object({
  name: z.string(),
  headline: z.string(),
  heroPhrases: z.array(z.string()),
  about: z.string(),
  photo: z.string().nullable(),
  resume: z.string().nullable(),
  socialLinks: z.array(
    z.object({ platform: z.enum(SOCIAL_PLATFORMS), label: z.string().nullish(), url: z.string(), isVisible: z.boolean() }),
  ),
  location: toggleableResponse(z.string()),
  publicEmail: toggleableResponse(z.string()),
  isOpenToWork: toggleableResponse(z.boolean()),
  yearsOfExperience: toggleableResponse(z.number()),
  languages: z.object({
    value: z.array(z.object({ name: z.string(), proficiency: z.string().nullish() })).nullish(),
    isVisible: z.boolean(),
  }),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;

// --- The form -----------------------------------------------------------------------------------

// For an email link, `url` holds just the address; `mailto:` is added when saving.
const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    label: z.string().trim().max(TEXT_LIMITS.tag, maxLengthMessage(TEXT_LIMITS.tag)),
    url: z.string().trim().max(TEXT_LIMITS.url, maxLengthMessage(TEXT_LIMITS.url)),
    isVisible: z.boolean(),
  })
  .superRefine((link, context) => {
    if (link.platform === 'other' && link.label === '') {
      context.addIssue({ code: 'custom', path: ['label'], message: 'Enter a label, such as "Blog"' });
    }
    if (link.platform === 'email' ? !isEmailAddress(link.url) : !isHttpUrl(link.url)) {
      context.addIssue({ code: 'custom', path: ['url'], message: link.platform === 'email' ? EMAIL_EXAMPLE : URL_MESSAGE });
    }
  })
  .transform((link) => ({
    platform: link.platform,
    label: link.label === '' ? null : link.label,
    url: link.platform === 'email' ? `${MAILTO_PREFIX}${link.url}` : link.url,
    isVisible: link.isVisible,
  }));

// Shared by the profile form and the save action; the output is exactly what `PUT /profile` expects.
export const profileFormSchema = z.object({
  name: requiredText(TEXT_LIMITS.name, 'Enter your name'),
  headline: requiredText(TEXT_LIMITS.title, 'Enter a headline, such as "Full-stack engineer"'),
  heroPhrases: z
    .array(requiredText(TEXT_LIMITS.name, 'Write the phrase or remove it'))
    .max(PROFILE_LIMITS.heroPhrases, `Add at most ${PROFILE_LIMITS.heroPhrases} phrases`),
  about: z.string().trim().max(TEXT_LIMITS.markdown, maxLengthMessage(TEXT_LIMITS.markdown)),
  photo: z.string().nullable(),
  resume: z.string().nullable(),
  socialLinks: z.array(socialLinkSchema).max(PROFILE_LIMITS.socialLinks, `Add at most ${PROFILE_LIMITS.socialLinks} links`),
  location: toggleable(optionalText(TEXT_LIMITS.name)),
  publicEmail: toggleable(optionalEmailSchema),
  isOpenToWork: toggleable(z.boolean()),
  yearsOfExperience: toggleable(
    z
      .number('Enter a whole number')
      .int('Enter a whole number')
      .min(0, 'Use 0 or more')
      .max(PROFILE_LIMITS.yearsOfExperience, `Use at most ${PROFILE_LIMITS.yearsOfExperience}`)
      .nullable(),
  ),
  languages: toggleable(
    z
      .array(
        z.object({
          name: requiredText(TEXT_LIMITS.tag, 'Enter the language or remove it'),
          proficiency: optionalText(TEXT_LIMITS.tag),
        }),
      )
      .max(PROFILE_LIMITS.languages, `Add at most ${PROFILE_LIMITS.languages} languages`),
  ),
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ProfilePayload = z.output<typeof profileFormSchema>;

export function emptySocialLink(): ProfileFormValues['socialLinks'][number] {
  return { platform: 'github', label: '', url: '', isVisible: true };
}

export function emptyLanguage(): ProfileFormValues['languages']['value'][number] {
  return { name: '', proficiency: '' };
}

// The saved profile as form values: nulls become empty fields, and email links lose their `mailto:`.
export function toProfileFormValues(profile: ProfileResponse): ProfileFormValues {
  return {
    name: profile.name,
    headline: profile.headline,
    heroPhrases: profile.heroPhrases,
    about: profile.about,
    photo: profile.photo,
    resume: profile.resume,
    socialLinks: profile.socialLinks.map((link) => ({
      platform: link.platform,
      label: link.label ?? '',
      url: link.platform === 'email' && link.url.startsWith(MAILTO_PREFIX) ? link.url.slice(MAILTO_PREFIX.length) : link.url,
      isVisible: link.isVisible,
    })),
    location: { value: profile.location.value ?? '', isVisible: profile.location.isVisible },
    publicEmail: { value: profile.publicEmail.value ?? '', isVisible: profile.publicEmail.isVisible },
    isOpenToWork: { value: profile.isOpenToWork.value ?? false, isVisible: profile.isOpenToWork.isVisible },
    yearsOfExperience: { value: profile.yearsOfExperience.value ?? null, isVisible: profile.yearsOfExperience.isVisible },
    languages: {
      value: (profile.languages.value ?? []).map((language) => ({ name: language.name, proficiency: language.proficiency ?? '' })),
      isVisible: profile.languages.isVisible,
    },
  };
}
