import 'server-only';

import { cache } from 'react';

import { getResourceOrNotFound, getResourcePage } from '@/lib/api/resource-queries';

import { CERTIFICATIONS_PATH, certificationSchema } from './schemas';

import type { Certification } from './schemas';
import type { ApiPage } from '@/lib/api/api-client';
import type { ListParams } from '@/lib/utils/list-params';

export function getCertificationPage(list: {
  params: ListParams;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<ApiPage<Certification>> {
  return getResourcePage(CERTIFICATIONS_PATH, certificationSchema, list);
}

// Cached per request: the edit page's metadata and body read the same item.
export const getCertification = cache((id: string): Promise<Certification> =>
  getResourceOrNotFound(CERTIFICATIONS_PATH, id, certificationSchema),
);
