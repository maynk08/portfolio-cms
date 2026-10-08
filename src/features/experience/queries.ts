import 'server-only';

import { cache } from 'react';

import { getResourceOrNotFound, getResourcePage } from '@/lib/api/resource-queries';

import { EXPERIENCE_PATH, experienceSchema } from './schemas';

import type { Experience } from './schemas';
import type { ApiPage } from '@/lib/api/api-client';
import type { ListParams } from '@/lib/utils/list-params';

export function getExperiencePage(list: {
  params: ListParams;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<ApiPage<Experience>> {
  return getResourcePage(EXPERIENCE_PATH, experienceSchema, list);
}

// Cached per request: the edit page's metadata and body read the same item.
export const getExperience = cache((id: string): Promise<Experience> => getResourceOrNotFound(EXPERIENCE_PATH, id, experienceSchema));
