'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS, buildListHref, describePageRange } from '@/lib/utils/list-params';

import type { Pagination } from '@/lib/api/api-client';

type DataTablePaginationProps = {
  pagination: Pagination;
  // "message" / "messages", for the item count.
  itemNoun: { singular: string; plural: string };
};

// The same pagination under every paginated table: count on the left, page size and page controls on the right.
export function DataTablePagination({ pagination, itemNoun }: DataTablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { page, pageSize, totalItems, totalPages } = pagination;

  if (totalItems === 0) {
    return null;
  }

  const hrefFor = (changes: { page?: number; pageSize?: number }): string => buildListHref(pathname, searchParams, changes);
  const hasSeveralPages = totalPages > 1;
  const canChangePageSize = totalItems > PAGE_SIZE_OPTIONS[0];
  const noun = totalItems === 1 ? itemNoun.singular : itemNoun.plural;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground tabular-nums" aria-live="polite">
        {hasSeveralPages ? `Showing ${describePageRange(pagination)} ${noun}` : `${totalItems.toLocaleString('en')} ${noun}`}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        {canChangePageSize && (
          <div className="flex items-center gap-2">
            <span id="page-size-label" className="text-muted-foreground">
              Per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                router.push(hrefFor({ pageSize: Number(value), page: 1 }));
              }}
            >
              <SelectTrigger size="sm" aria-labelledby="page-size-label" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasSeveralPages && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground tabular-nums">
              Page {page} of {totalPages}
            </span>
            <PageLink href={page > 1 ? hrefFor({ page: page - 1 }) : null} label="Previous page" icon={<ChevronLeftIcon aria-hidden />} />
            <PageLink
              href={page < totalPages ? hrefFor({ page: page + 1 }) : null}
              label="Next page"
              icon={<ChevronRightIcon aria-hidden />}
            />
          </div>
        )}
      </div>
    </nav>
  );
}

function PageLink({ href, label, icon }: { href: string | null; label: string; icon: React.ReactNode }) {
  if (href === null) {
    return (
      <Button variant="outline" size="icon-sm" disabled aria-label={label}>
        {icon}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="icon-sm" asChild>
      <GuardedLink href={href} aria-label={label}>
        {icon}
      </GuardedLink>
    </Button>
  );
}
