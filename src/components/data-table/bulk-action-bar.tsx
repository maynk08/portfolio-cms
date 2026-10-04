'use client';

import { Button } from '@/components/ui/button';

import type { ReactNode } from 'react';

type BulkActionBarProps = {
  selectedCount: number;
  itemNoun: { singular: string; plural: string };
  onClearSelection: () => void;
  // The bulk actions; destructive ones confirm with the count: "Delete 3 selected messages?"
  children: ReactNode;
};

export function BulkActionBar({ selectedCount, itemNoun, onClearSelection, children }: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm"
    >
      <span aria-live="polite" className="font-medium tabular-nums">
        {selectedCount} {selectedCount === 1 ? itemNoun.singular : itemNoun.plural} selected
      </span>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear selection
      </Button>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
