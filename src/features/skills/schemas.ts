import { z } from 'zod';

import { requiredText } from '@/lib/validation/common-schemas';
import { TEXT_LIMITS, maxLengthMessage } from '@/lib/validation/text-limits';

export const SKILL_GROUPS_PATH = '/skill-groups';
export const MAX_SKILLS_PER_GROUP = 50;
export const SIMPLE_ICONS_URL = 'https://simpleicons.org';

const ICON_SLUG_PATTERN = /^[a-z0-9]+$/;

export const skillGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(z.object({ name: z.string(), icon: z.string().nullish(), isVisible: z.boolean() })),
  isVisible: z.boolean(),
});

export type SkillGroup = z.infer<typeof skillGroupSchema>;

// "8 skills (2 hidden)"
export function describeSkillCount(group: SkillGroup): string {
  const total = group.skills.length;
  const hidden = group.skills.filter((skill) => !skill.isVisible).length;
  const count = `${total} ${total === 1 ? 'skill' : 'skills'}`;
  return hidden === 0 ? count : `${count} (${hidden} hidden)`;
}

export const skillGroupFormSchema = z.object({
  name: requiredText(TEXT_LIMITS.name, 'Enter the group name, such as "Backend"'),
  skills: z
    .array(
      z.object({
        name: requiredText(TEXT_LIMITS.tag, 'Enter the skill or remove it'),
        icon: z
          .string()
          .trim()
          .max(TEXT_LIMITS.tag, maxLengthMessage(TEXT_LIMITS.tag))
          .refine(
            (icon) => icon === '' || ICON_SLUG_PATTERN.test(icon),
            'Use the Simple Icons slug: lowercase letters and numbers, like nodedotjs',
          )
          .transform((icon) => (icon === '' ? null : icon)),
        isVisible: z.boolean(),
      }),
    )
    .max(MAX_SKILLS_PER_GROUP, `Add at most ${MAX_SKILLS_PER_GROUP} skills`),
  isVisible: z.boolean(),
});

export type SkillGroupFormValues = z.input<typeof skillGroupFormSchema>;

export const EMPTY_SKILL_GROUP: SkillGroupFormValues = { name: '', skills: [], isVisible: true };

export function emptySkill(): SkillGroupFormValues['skills'][number] {
  return { name: '', icon: '', isVisible: true };
}

export function toSkillGroupFormValues(group: SkillGroup): SkillGroupFormValues {
  return {
    name: group.name,
    skills: group.skills.map((skill) => ({ name: skill.name, icon: skill.icon ?? '', isVisible: skill.isVisible })),
    isVisible: group.isVisible,
  };
}
