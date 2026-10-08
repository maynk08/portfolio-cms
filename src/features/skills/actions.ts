'use server';

import { deleteResource, quoteLabel, reorderResources, saveResource, setResourceFlag } from '@/lib/actions/resource-actions';

import { SKILL_GROUPS_PATH, skillGroupFormSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

const describe = (input: { name: string }): string => `Skill group "${input.name}"`;

export async function createSkillGroup(values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: SKILL_GROUPS_PATH, schema: skillGroupFormSchema, values, describe });
}

export async function updateSkillGroup(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: SKILL_GROUPS_PATH, id, schema: skillGroupFormSchema, values, describe });
}

export async function deleteSkillGroup(id: unknown, label: unknown): Promise<ActionResult> {
  return deleteResource(SKILL_GROUPS_PATH, id, `Skill group ${quoteLabel(label)}`);
}

export async function setSkillGroupVisibility(id: unknown, isVisible: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    SKILL_GROUPS_PATH,
    id,
    'isVisible',
    isVisible,
    `Skill group ${quoteLabel(label)} ${isVisible === true ? 'shown on' : 'hidden from'} the portfolio`,
  );
}

export async function reorderSkillGroups(ids: unknown): Promise<ActionResult> {
  return reorderResources(SKILL_GROUPS_PATH, ids);
}
