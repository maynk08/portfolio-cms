import { z } from 'zod';

import { requiredText } from '@/lib/validation/common-schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

export const SECTION_KEYS = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact'] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

// What each section shows on the portfolio, so the admin knows what hiding it removes.
export const SECTION_DETAILS: Record<SectionKey, { name: string; description: string }> = {
  hero: { name: 'Hero', description: 'Name, headline, typing phrases and social links' },
  about: { name: 'About', description: 'About text and photo' },
  experience: { name: 'Experience', description: 'Jobs, newest first' },
  projects: { name: 'Projects', description: 'Featured projects, and the project pages' },
  skills: { name: 'Skills', description: 'Skill groups' },
  education: { name: 'Education', description: 'Degrees, newest first' },
  certifications: { name: 'Certifications', description: 'Certificates, newest first' },
  contact: { name: 'Contact', description: 'Contact form, public email and social links' },
};

export const sectionKeySchema = z.enum(SECTION_KEYS);

export const sectionSchema = z.object({
  key: sectionKeySchema,
  heading: z.string(),
  isVisible: z.boolean(),
  order: z.number(),
});

export type Section = z.infer<typeof sectionSchema>;

export const renameSectionSchema = z.object({
  heading: requiredText(TEXT_LIMITS.name, 'Enter a heading'),
});

export type RenameSectionValues = z.input<typeof renameSectionSchema>;
