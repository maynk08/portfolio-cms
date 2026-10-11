'use client';

import { ArrowDownIcon, ArrowUpIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import { RowActions } from '@/components/data-table/row-actions';

import type { RowAction } from '@/components/data-table/row-actions';
import type { ActionResult } from '@/lib/actions/action-result';

export interface ReorderControls {
  isFirst: boolean;
  isLast: boolean;
  onMove: (offset: -1 | 1) => void;
  // Shown instead of "Already first" / "Already last" when the row cannot move at all, e.g. the hero.
  lockedReason?: string;
}

// Move up / Move down for manually ordered lists, the menu alternative to dragging a row.
export function moveRowActions(reorder: ReorderControls): RowAction[] {
  return [
    {
      label: 'Move up',
      icon: ArrowUpIcon,
      disabledReason: reorder.lockedReason ?? (reorder.isFirst ? 'Already first' : undefined),
      onSelect: () => {
        reorder.onMove(-1);
      },
    },
    {
      label: 'Move down',
      icon: ArrowDownIcon,
      disabledReason: reorder.lockedReason ?? (reorder.isLast ? 'Already last' : undefined),
      onSelect: () => {
        reorder.onMove(1);
      },
    },
  ];
}

type ItemRowActionsProps = {
  // "project", for the confirmation: `Delete project "Portfolio CMS"?`
  itemNoun: string;
  itemLabel: string;
  editHref: string;
  onDelete: () => Promise<ActionResult>;
  // Manually ordered lists add Move up / Move down in front of Edit.
  reorder?: ReorderControls;
};

// The row actions of every content list: [Move up, Move down,] Edit, and Delete in the ⋮ menu, always confirmed.
export function ItemRowActions({ itemNoun, itemLabel, editHref, onDelete, reorder }: ItemRowActionsProps) {
  const moveActions = reorder === undefined ? [] : moveRowActions(reorder);

  return (
    <RowActions
      itemLabel={itemLabel}
      actions={[...moveActions, { label: 'Edit', icon: PencilIcon, href: editHref }]}
      destructiveActions={[
        {
          label: 'Delete',
          icon: Trash2Icon,
          confirm: {
            title: `Delete ${itemNoun} "${itemLabel}"?`,
            description: 'It will be removed from the CMS and the portfolio. This cannot be undone.',
            confirmLabel: 'Delete',
            pendingLabel: 'Deleting…',
          },
          onConfirm: onDelete,
        },
      ]}
    />
  );
}
