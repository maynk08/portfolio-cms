import 'server-only';

import { cache } from 'react';

import { getAllResources, getResourceOrNotFound } from '@/lib/api/resource-queries';

import { SKILL_GROUPS_PATH, skillGroupSchema } from './schemas';

import type { SkillGroup } from './schemas';

// Every group in the manual order (not paginated, so ↑ / ↓ can move any of them).
export function listSkillGroups(): Promise<SkillGroup[]> {
  return getAllResources(SKILL_GROUPS_PATH, skillGroupSchema);
}

// Cached per request: the edit page's metadata and body read the same item.
export const getSkillGroup = cache((id: string): Promise<SkillGroup> => getResourceOrNotFound(SKILL_GROUPS_PATH, id, skillGroupSchema));
