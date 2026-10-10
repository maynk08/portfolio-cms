import 'server-only';

import { notFound, redirect } from 'next/navigation';

import { apiRequest, apiRequestAll, apiRequestPage } from '@/lib/api/api-client';
import { ApiNotFoundError } from '@/lib/api/api-errors';
import { getOutOfRangeHref } from '@/lib/utils/list-params';
import { OBJECT_ID_PATTERN } from '@/lib/validation/common-schemas';

import type { ApiPage } from '@/lib/api/api-client';
import type { ListParams } from '@/lib/utils/list-params';
import type { z } from 'zod';

// One item for an edit page; a malformed or unknown ID shows the not-found page.
export async function getResourceOrNotFound<T>(path: string, id: string, schema: z.ZodType<T>): Promise<T> {
  if (!OBJECT_ID_PATTERN.test(id)) {
    notFound();
  }
  try {
    return await apiRequest(`${path}/${id}`, { schema });
  } catch (error) {
    if (error instanceof ApiNotFoundError) {
      notFound();
    }
    throw error;
  }
}

// One page of a date-sorted list; a page past the end (after deletes) redirects to the last page.
export async function getResourcePage<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  list: { params: ListParams; pathname: string; searchParams: Record<string, string | string[] | undefined> },
  // Filters passed on to the backend, such as `{ kind: 'image' }`.
  filters: Record<string, string | undefined> = {},
): Promise<ApiPage<T>> {
  const page = await apiRequestPage(path, { itemSchema, query: { ...filters, page: list.params.page, pageSize: list.params.pageSize } });
  const outOfRangeHref = getOutOfRangeHref(list.pathname, list.searchParams, page.pagination);
  if (outOfRangeHref !== null) {
    redirect(outOfRangeHref);
  }
  return page;
}

// Every item of a manually ordered list, in order.
export function getAllResources<T>(path: string, itemSchema: z.ZodType<T>): Promise<T[]> {
  return apiRequestAll(path, { itemSchema });
}
