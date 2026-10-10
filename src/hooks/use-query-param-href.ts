'use client';

import { usePathname, useSearchParams } from 'next/navigation';

// The current URL with one query value set or removed, keeping the rest (filters, page). Used for panels such as
// `?file=<id>` and `?message=<id>` that open over a list.
export function useQueryParamHref(name: string): (value: string | null) => string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === null) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    const query = params.toString();
    return query === '' ? pathname : `${pathname}?${query}`;
  };
}
