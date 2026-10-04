import { describe, expect, it } from 'vitest';

import { buildListHref, describePageRange, getOutOfRangeHref, parseListParams } from '@/lib/utils/list-params';

const pagination = (page: number, totalItems: number, pageSize = 20) => ({
  page,
  pageSize,
  totalItems,
  totalPages: Math.ceil(totalItems / pageSize),
});

describe('parseListParams', () => {
  it('reads page and page size from the URL', () => {
    expect(parseListParams({ page: '3', pageSize: '50' })).toEqual({ page: 3, pageSize: 50 });
  });

  it.each([
    ['missing values', {}],
    ['garbage', { page: 'abc', pageSize: 'lots' }],
    ['a page below 1', { page: '0' }],
    ['a page size that is not offered', { pageSize: '37' }],
    ['repeated values', { page: ['2', '5'], pageSize: ['100'] }],
  ])('falls back to the defaults for %s', (_case, searchParams) => {
    const { page, pageSize } = parseListParams(searchParams);

    expect(page).toBe('page' in searchParams && Array.isArray(searchParams.page) ? 2 : 1);
    expect(pageSize).toBe('pageSize' in searchParams && Array.isArray(searchParams.pageSize) ? 100 : 20);
  });
});

describe('buildListHref', () => {
  it('keeps other query values and drops defaults', () => {
    expect(buildListHref('/messages', new URLSearchParams('status=unread&page=3'), { page: 1 })).toBe('/messages?status=unread');
    expect(buildListHref('/messages', { status: 'read' }, { page: 2, pageSize: 50 })).toBe('/messages?status=read&page=2&pageSize=50');
    expect(buildListHref('/media', {}, { pageSize: 20 })).toBe('/media');
  });
});

describe('getOutOfRangeHref', () => {
  it('points at the last page when the requested one no longer exists', () => {
    expect(getOutOfRangeHref('/messages', { page: '4' }, pagination(4, 45))).toBe('/messages?page=3');
  });

  it('points at the first page when the list became empty', () => {
    expect(getOutOfRangeHref('/messages', { page: '2' }, pagination(2, 0))).toBe('/messages');
  });

  it('returns null for a page that exists', () => {
    expect(getOutOfRangeHref('/messages', { page: '3' }, pagination(3, 45))).toBeNull();
  });
});

describe('describePageRange', () => {
  it('describes the rows on the page', () => {
    expect(describePageRange(pagination(2, 57))).toBe('21–40 of 57');
    expect(describePageRange(pagination(3, 57))).toBe('41–57 of 57');
    expect(describePageRange(pagination(1, 1234, 100))).toBe('1–100 of 1,234');
  });
});
