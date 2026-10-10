import { GuardedLink } from '@/components/navigation/guarded-link';
import { cn } from '@/lib/utils/cn';

import type { MessageCounts } from '@/features/messages/schemas';

export type InboxView = 'unread' | 'read' | 'archived' | 'all';

const VIEWS: { view: InboxView; label: string }[] = [
  { view: 'unread', label: 'Unread' },
  { view: 'read', label: 'Read' },
  { view: 'archived', label: 'Archived' },
  { view: 'all', label: 'All' },
];

// Links rather than tabs: the view lives in the URL, so it survives reading a message and coming back.
export function MessageStatusTabs({ current, counts }: { current: InboxView; counts: MessageCounts }) {
  const countOf = (view: InboxView): number => (view === 'all' ? counts.unread + counts.read + counts.archived : counts[view]);

  return (
    <nav aria-label="Message views" className="flex w-fit gap-1 rounded-lg bg-muted p-1 text-sm">
      {VIEWS.map(({ view, label }) => {
        const isCurrent = view === current;
        return (
          <GuardedLink
            key={view}
            href={view === 'unread' ? '/messages' : `/messages?status=${view}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn('rounded-md px-3 py-1 text-muted-foreground', isCurrent && 'bg-background font-medium text-foreground shadow-sm')}
          >
            {label} <span className="tabular-nums">({countOf(view).toLocaleString('en')})</span>
          </GuardedLink>
        );
      })}
    </nav>
  );
}
