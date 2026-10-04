import { describe, expect, it } from 'vitest';

import { emptySocialLink, profileFormSchema, toProfileFormValues } from '@/features/profile/schemas';

import type { ProfileFormValues, ProfileResponse } from '@/features/profile/schemas';

const savedProfile: ProfileResponse = {
  name: 'Ada',
  headline: 'Engineer',
  heroPhrases: ['I build things'],
  about: '',
  photo: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  resume: null,
  socialLinks: [
    { platform: 'email', label: null, url: 'mailto:ada@example.com', isVisible: true },
    { platform: 'other', label: 'Blog', url: 'https://blog.example.com', isVisible: false },
  ],
  location: { value: null, isVisible: false },
  publicEmail: { value: 'ada@example.com', isVisible: true },
  isOpenToWork: { value: true, isVisible: true },
  yearsOfExperience: { value: null, isVisible: false },
  languages: { value: [{ name: 'English', proficiency: null }], isVisible: true },
};

function withLink(link: Partial<ProfileFormValues['socialLinks'][number]>): ProfileFormValues {
  return { ...toProfileFormValues(savedProfile), socialLinks: [{ ...emptySocialLink(), ...link }] };
}

function fieldErrors(values: ProfileFormValues): Record<string, string> {
  const result = profileFormSchema.safeParse(values);
  return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]));
}

describe('profile form values', () => {
  it('turns the saved profile into form values: nulls become empty fields and email links lose mailto:', () => {
    const values = toProfileFormValues(savedProfile);

    expect(values.socialLinks[0]).toEqual({ platform: 'email', label: '', url: 'ada@example.com', isVisible: true });
    expect(values.location).toEqual({ value: '', isVisible: false });
    expect(values.languages.value).toEqual([{ name: 'English', proficiency: '' }]);
    expect(values.photo).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('turns the form values back into exactly what the backend stores', () => {
    expect(profileFormSchema.parse(toProfileFormValues(savedProfile))).toEqual(savedProfile);
  });

  // The save action validates the raw form values again; it must never be handed already-transformed output.
  it('only validates raw form values, not its own output', () => {
    const output = profileFormSchema.parse(toProfileFormValues(savedProfile));

    expect(profileFormSchema.safeParse(output).success).toBe(false);
  });
});

describe('social link rules', () => {
  it.each([
    [
      'a GitHub link without a URL',
      { platform: 'github' as const, url: '' },
      { 'socialLinks.0.url': 'Enter a full URL starting with https://' },
    ],
    [
      'a GitHub link with a plain word',
      { platform: 'github' as const, url: 'github' },
      { 'socialLinks.0.url': 'Enter a full URL starting with https://' },
    ],
    [
      'an email link with a URL',
      { platform: 'email' as const, url: 'https://example.com' },
      { 'socialLinks.0.url': 'Enter an email address, like name@example.com' },
    ],
    [
      'an "other" link without a label',
      { platform: 'other' as const, url: 'https://example.com' },
      { 'socialLinks.0.label': 'Enter a label, such as "Blog"' },
    ],
  ])('rejects %s', (_case, link, expected) => {
    expect(fieldErrors(withLink(link))).toEqual(expected);
  });

  it('accepts a labelled website link and an email address', () => {
    expect(fieldErrors(withLink({ platform: 'website', url: 'https://ada.dev', label: 'Home' }))).toEqual({});
    expect(fieldErrors(withLink({ platform: 'email', url: 'ada@example.com' }))).toEqual({});
  });
});

describe('optional details', () => {
  it('saves empty details as null and checks the public email', () => {
    const values = { ...toProfileFormValues(savedProfile), publicEmail: { value: '', isVisible: true } };
    expect(profileFormSchema.parse(values).publicEmail).toEqual({ value: null, isVisible: true });

    expect(fieldErrors({ ...values, publicEmail: { value: 'not-an-email', isVisible: true } })).toEqual({
      'publicEmail.value': 'Enter an email address, like name@example.com',
    });
  });

  it('requires a name for every language and a whole number of years', () => {
    const values: ProfileFormValues = {
      ...toProfileFormValues(savedProfile),
      languages: { value: [{ name: ' ', proficiency: '' }], isVisible: true },
      yearsOfExperience: { value: 2.5, isVisible: true },
    };

    expect(fieldErrors(values)).toEqual({
      'languages.value.0.name': 'Enter the language or remove it',
      'yearsOfExperience.value': 'Enter a whole number',
    });
  });
});
