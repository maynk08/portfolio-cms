import { GuardedLink } from '@/components/navigation/guarded-link';

import type { LucideIcon } from 'lucide-react';

type ContentCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  // "4 projects", "2 featured"
  value: string;
  detail?: string;
};

// A dashboard tile that links to the page it summarises.
export function ContentCard({ href, icon: Icon, title, value, detail }: ContentCardProps) {
  return (
    <GuardedLink
      href={href}
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon aria-hidden className="size-4" />
        {title}
      </span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {detail !== undefined && <span className="text-sm text-muted-foreground">{detail}</span>}
    </GuardedLink>
  );
}
