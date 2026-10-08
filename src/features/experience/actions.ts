'use server';

import { deleteResource, quoteLabel, saveResource, setResourceFlag } from '@/lib/actions/resource-actions';

import { EXPERIENCE_PATH, describeExperience, experienceFormSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

const describe = (input: { role: string; company: string }): string => `Experience "${describeExperience(input)}"`;

export async function createExperience(values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: EXPERIENCE_PATH, schema: experienceFormSchema, values, describe });
}

export async function updateExperience(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: EXPERIENCE_PATH, id, schema: experienceFormSchema, values, describe });
}

export async function deleteExperience(id: unknown, label: unknown): Promise<ActionResult> {
  return deleteResource(EXPERIENCE_PATH, id, `Experience ${quoteLabel(label)}`);
}

export async function setExperienceVisibility(id: unknown, isVisible: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    EXPERIENCE_PATH,
    id,
    'isVisible',
    isVisible,
    `Experience ${quoteLabel(label)} ${isVisible === true ? 'shown on' : 'hidden from'} the portfolio`,
  );
}
