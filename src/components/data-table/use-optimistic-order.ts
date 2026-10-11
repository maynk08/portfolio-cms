'use client';

import { useOptimistic, useTransition } from 'react';

import { notifyError } from '@/components/feedback/notify';
import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';

import type { ActionResult } from '@/lib/actions/action-result';

/**
 * Moves rows at once (dragged to a position, or one step up or down) and saves the new order in the background. The
 * row moving is the confirmation; if saving fails, the order snaps back and an error toast explains.
 */
export function useOptimisticOrder<T>(rows: T[], getId: (row: T) => string, saveOrder: (ids: string[]) => Promise<ActionResult>) {
  const [isSaving, startTransition] = useTransition();
  const [orderedRows, setOrderedRows] = useOptimistic(rows);

  const moveTo = (fromIndex: number, toIndex: number): void => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= orderedRows.length) {
      return;
    }
    const next = [...orderedRows];
    const [moved] = next.splice(fromIndex, 1);
    if (moved === undefined) {
      return;
    }
    next.splice(toIndex, 0, moved);
    startTransition(async () => {
      setOrderedRows(next);
      const result = await saveOrder(next.map(getId));
      if (!result.ok) {
        notifyError(result.formError ?? GENERIC_ERROR_MESSAGE);
      }
    });
  };

  const move = (index: number, offset: -1 | 1): void => {
    moveTo(index, index + offset);
  };

  return { orderedRows, move, moveTo, isSaving };
}
