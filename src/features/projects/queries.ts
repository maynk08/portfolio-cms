import 'server-only';

import { cache } from 'react';

import { getAllResources, getResourceOrNotFound } from '@/lib/api/resource-queries';

import { PROJECTS_PATH, projectSchema } from './schemas';

import type { Project } from './schemas';

// Every project in the manual order (not paginated, so ↑ / ↓ can move any of them).
export function listProjects(): Promise<Project[]> {
  return getAllResources(PROJECTS_PATH, projectSchema);
}

// Cached per request: the edit page's metadata and body read the same item.
export const getProject = cache((id: string): Promise<Project> => getResourceOrNotFound(PROJECTS_PATH, id, projectSchema));
