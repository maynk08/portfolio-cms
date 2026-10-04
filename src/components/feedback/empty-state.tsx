import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: LucideIcon;
  // "No projects yet" when nothing exists; "No messages match this filter" when a filter hides everything.
  title: string;
  description?: string;
  // The action that creates the first item, or clears the filter.
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      {Icon !== undefined && <Icon aria-hidden className="size-8 text-muted-foreground" />}
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        {description !== undefined && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
