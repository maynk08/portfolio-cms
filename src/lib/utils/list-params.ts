import { z } from 'zod';

import type { Pagination } from '@/lib/api/api-client';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListParams {
  page: number;
  pageSize: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const pageSchema = z.coerce.number().int().min(1).catch(1);
const pageSizeSchema = z.coerce
  .number()
  .int()
  .refine((size) => PAGE_SIZE_OPTIONS.some((option) => option === size))
  .catch(DEFAULT_PAGE_SIZE);

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Reads `page` and `pageSize` from the URL; anything invalid falls back to the defaults instead of failing.
export function parseListParams(searchParams: SearchParams): ListParams {
  return {
    page: pageSchema.parse(firstValue(searchParams.page) ?? 1),
    pageSize: pageSizeSchema.parse(firstValue(searchParams.pageSize) ?? DEFAULT_PAGE_SIZE),
  };
}

// The same list URL with some query values changed; defaults are dropped so URLs stay short.
export function buildListHref(pathname: string, searchParams: URLSearchParams | SearchParams, changes: Partial<ListParams>): string {
  const params = new URLSearchParams();
  const entries = searchParams instanceof URLSearchParams ? searchParams.entries() : Object.entries(searchParams);
  for (const [name, value] of entries) {
    const text = firstValue(value);
    if (text !== undefined) {
      params.set(name, text);
    }
  }
  for (const [name, value] of Object.entries(changes)) {
    params.set(name, String(value));
  }
  if (params.get('page') === '1') {
    params.delete('page');
  }
  if (params.get('pageSize') === String(DEFAULT_PAGE_SIZE)) {
    params.delete('pageSize');
  }
  const query = params.toString();
  return query === '' ? pathname : `${pathname}?${query}`;
}

// After deletes, the requested page may be past the end; returns the last page's URL to redirect to, if so.
export function getOutOfRangeHref(pathname: string, searchParams: SearchParams, pagination: Pagination): string | null {
  const lastPage = Math.max(1, pagination.totalPages);
  return pagination.page > lastPage ? buildListHref(pathname, searchParams, { page: lastPage }) : null;
}

// "21–40 of 57"
export function describePageRange({ page, pageSize, totalItems }: Pagination): string {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  return `${first.toLocaleString('en')}–${last.toLocaleString('en')} of ${totalItems.toLocaleString('en')}`;
}
