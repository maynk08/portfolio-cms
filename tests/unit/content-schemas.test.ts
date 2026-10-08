import { describe, expect, it } from 'vitest';

import { certificationFormSchema, EMPTY_CERTIFICATION, isExpired } from '@/features/certifications/schemas';
import { EMPTY_EXPERIENCE, experienceFormSchema, toExperienceFormValues } from '@/features/experience/schemas';
import { EMPTY_PROJECT, projectFormSchema } from '@/features/projects/schemas';
import { describeSkillCount, skillGroupFormSchema } from '@/features/skills/schemas';

import type { z } from 'zod';

function errorsOf(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]));
}

const job = { ...EMPTY_EXPERIENCE, company: 'Acme', role: 'Engineer', startDate: '2022-03' };

describe('date ranges', () => {
  it('requires a start month and an explicit end: a month or "ongoing"', () => {
    expect(errorsOf(experienceFormSchema.safeParse({ ...job, startDate: null }))).toEqual({
      startDate: 'Pick the month you started',
      endDate: 'Pick the month you left, or tick “I currently work here”',
    });
  });

  it('refuses an end month before the start month', () => {
    expect(errorsOf(experienceFormSchema.safeParse({ ...job, endDate: '2021-12' }))).toEqual({
      endDate: 'The end month cannot be before the start month',
    });
  });

  it('saves an ongoing item without an end month, whatever the hidden field holds', () => {
    const saved = experienceFormSchema.parse({ ...job, endDate: '2024-01', isOngoing: true });

    expect(saved).toMatchObject({ startDate: '2022-03', endDate: null });
    expect(saved).not.toHaveProperty('isOngoing');
  });

  it('turns a saved item without an end month into a ticked "ongoing" box', () => {
    const values = toExperienceFormValues({
      id: 'a',
      company: 'Acme',
      role: 'Engineer',
      startDate: '2022-03',
      endDate: null,
      highlights: [],
      techStack: [],
      isVisible: true,
    });

    expect(values).toMatchObject({ startDate: '2022-03', endDate: null, isOngoing: true, location: '', companyUrl: '' });
  });

  it('saves certification dates as issue and expiry dates', () => {
    const saved = certificationFormSchema.parse({
      ...EMPTY_CERTIFICATION,
      name: 'AWS',
      issuer: 'Amazon',
      startDate: '2024-01',
      endDate: '2027-01',
    });

    expect(saved).toMatchObject({ issueDate: '2024-01', expiryDate: '2027-01' });
    expect(saved).not.toHaveProperty('startDate');
  });

  it('marks a certificate expired only after its expiry month', () => {
    expect(isExpired('2026-09', '2026-10')).toBe(true);
    expect(isExpired('2026-10', '2026-10')).toBe(false);
    expect(isExpired(null, '2026-10')).toBe(false);
  });
});

describe('project slugs', () => {
  it('leaves an empty slug out when creating, so the backend makes one from the title', () => {
    const saved = projectFormSchema('create').parse({ ...EMPTY_PROJECT, title: 'My App' });

    expect(saved).not.toHaveProperty('slug', expect.anything());
    expect(JSON.parse(JSON.stringify(saved))).not.toHaveProperty('slug');
  });

  it('requires a valid slug when editing', () => {
    expect(errorsOf(projectFormSchema('edit').safeParse({ ...EMPTY_PROJECT, title: 'My App' }))).toEqual({ slug: 'Enter a slug' });
    expect(errorsOf(projectFormSchema('edit').safeParse({ ...EMPTY_PROJECT, title: 'My App', slug: 'My App' }))).toEqual({
      slug: 'Use lowercase letters, numbers and single hyphens, like my-project',
    });
  });

  it('checks optional links', () => {
    expect(errorsOf(projectFormSchema('create').safeParse({ ...EMPTY_PROJECT, title: 'x', liveUrl: 'example.com' }))).toEqual({
      liveUrl: 'Enter a full URL starting with https://',
    });
  });
});

describe('skill groups', () => {
  it('accepts Simple Icons slugs and saves an empty icon as null', () => {
    const saved = skillGroupFormSchema.parse({
      name: 'Backend',
      isVisible: true,
      skills: [
        { name: 'Node.js', icon: 'nodedotjs', isVisible: true },
        { name: 'SQL', icon: '', isVisible: false },
      ],
    });

    expect(saved.skills.map((skill) => skill.icon)).toEqual(['nodedotjs', null]);
  });

  it('refuses an icon that is not a slug', () => {
    expect(
      errorsOf(
        skillGroupFormSchema.safeParse({ name: 'Backend', isVisible: true, skills: [{ name: 'Node', icon: 'Node.js', isVisible: true }] }),
      ),
    ).toEqual({
      'skills.0.icon': 'Use the Simple Icons slug: lowercase letters and numbers, like nodedotjs',
    });
  });

  it('describes how many skills a group has and how many are hidden', () => {
    const skill = (isVisible: boolean) => ({ name: 'x', icon: null, isVisible });

    expect(describeSkillCount({ id: 'a', name: 'g', isVisible: true, skills: [skill(true)] })).toBe('1 skill');
    expect(describeSkillCount({ id: 'a', name: 'g', isVisible: true, skills: [skill(true), skill(false), skill(false)] })).toBe(
      '3 skills (2 hidden)',
    );
  });
});
