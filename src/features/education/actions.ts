'use server';

import { deleteResource, quoteLabel, saveResource, setResourceFlag } from '@/lib/actions/resource-actions';

import { EDUCATION_PATH, describeEducation, educationFormSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

const describe = (input: { degree: string; institution: string }): string => `Education "${describeEducation(input)}"`;

export async function createEducation(values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: EDUCATION_PATH, schema: educationFormSchema, values, describe });
}

export async function updateEducation(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: EDUCATION_PATH, id, schema: educationFormSchema, values, describe });
}

export async function deleteEducation(id: unknown, label: unknown): Promise<ActionResult> {
  return deleteResource(EDUCATION_PATH, id, `Education ${quoteLabel(label)}`);
}

export async function setEducationVisibility(id: unknown, isVisible: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    EDUCATION_PATH,
    id,
    'isVisible',
    isVisible,
    `Education ${quoteLabel(label)} ${isVisible === true ? 'shown on' : 'hidden from'} the portfolio`,
  );
}
