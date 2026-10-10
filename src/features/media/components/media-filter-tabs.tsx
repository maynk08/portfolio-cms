import { GuardedLink } from '@/components/navigation/guarded-link';
import { cn } from '@/lib/utils/cn';

import type { MediaKind } from '@/features/media/schemas';

const FILTERS: { label: string; kind: MediaKind | undefined }[] = [
  { label: 'All', kind: undefined },
  { label: 'Images', kind: 'image' },
  { label: 'Documents', kind: 'document' },
];

// Links rather than tabs: the filter lives in the URL, so it survives opening a file and coming back.
export function MediaFilterTabs({ current }: { current: MediaKind | undefined }) {
  return (
    <nav aria-label="Filter files" className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
      {FILTERS.map((filter) => {
        const isCurrent = filter.kind === current;
        return (
          <GuardedLink
            key={filter.label}
            href={filter.kind === undefined ? '/media' : `/media?kind=${filter.kind}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn('rounded-md px-3 py-1 text-muted-foreground', isCurrent && 'bg-background font-medium text-foreground shadow-sm')}
          >
            {filter.label}
          </GuardedLink>
        );
      })}
    </nav>
  );
}
