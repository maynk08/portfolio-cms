'use server';

import { deleteResource, quoteLabel, reorderResources, saveResource, setResourceFlag } from '@/lib/actions/resource-actions';

import { PROJECTS_PATH, projectFormSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

const describe = (input: { title: string }): string => `Project "${input.title}"`;

export async function createProject(values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: PROJECTS_PATH, schema: projectFormSchema('create'), values, describe });
}

export async function updateProject(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: PROJECTS_PATH, id, schema: projectFormSchema('edit'), values, describe });
}

export async function deleteProject(id: unknown, label: unknown): Promise<ActionResult> {
  return deleteResource(PROJECTS_PATH, id, `Project ${quoteLabel(label)}`);
}

export async function setProjectVisibility(id: unknown, isVisible: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    PROJECTS_PATH,
    id,
    'isVisible',
    isVisible,
    `Project ${quoteLabel(label)} ${isVisible === true ? 'shown on' : 'hidden from'} the portfolio`,
  );
}

export async function setProjectFeatured(id: unknown, isFeatured: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    PROJECTS_PATH,
    id,
    'isFeatured',
    isFeatured,
    `Project ${quoteLabel(label)} ${isFeatured === true ? 'featured on' : 'no longer featured on'} the home page`,
  );
}

export async function reorderProjects(ids: unknown): Promise<ActionResult> {
  return reorderResources(PROJECTS_PATH, ids);
}
