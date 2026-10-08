'use client';

import { ArrowDownIcon, ArrowUpIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import { RowActions } from '@/components/data-table/row-actions';

import type { RowAction } from '@/components/data-table/row-actions';
import type { ActionResult } from '@/lib/actions/action-result';

type ItemRowActionsProps = {
  // "project", for the confirmation: `Delete project "Portfolio CMS"?`
  itemNoun: string;
  itemLabel: string;
  editHref: string;
  onDelete: () => Promise<ActionResult>;
  // Manually ordered lists add Move up / Move down in front of Edit.
  reorder?: { isFirst: boolean; isLast: boolean; onMove: (offset: -1 | 1) => void };
};

// The row actions of every content list: [Move up, Move down,] Edit, and Delete in the ⋮ menu, always confirmed.
export function ItemRowActions({ itemNoun, itemLabel, editHref, onDelete, reorder }: ItemRowActionsProps) {
  const moveActions: RowAction[] =
    reorder === undefined
      ? []
      : [
          {
            label: 'Move up',
            icon: ArrowUpIcon,
            disabledReason: reorder.isFirst ? 'Already first' : undefined,
            onSelect: () => {
              reorder.onMove(-1);
            },
          },
          {
            label: 'Move down',
            icon: ArrowDownIcon,
            disabledReason: reorder.isLast ? 'Already last' : undefined,
            onSelect: () => {
              reorder.onMove(1);
            },
          },
        ];

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
