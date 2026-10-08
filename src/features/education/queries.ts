import 'server-only';

import { cache } from 'react';

import { getResourceOrNotFound, getResourcePage } from '@/lib/api/resource-queries';

import { EDUCATION_PATH, educationSchema } from './schemas';

import type { Education } from './schemas';
import type { ApiPage } from '@/lib/api/api-client';
import type { ListParams } from '@/lib/utils/list-params';

export function getEducationPage(list: {
  params: ListParams;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<ApiPage<Education>> {
  return getResourcePage(EDUCATION_PATH, educationSchema, list);
}

// Cached per request: the edit page's metadata and body read the same item.
export const getEducation = cache((id: string): Promise<Education> => getResourceOrNotFound(EDUCATION_PATH, id, educationSchema));
