'use client';

import { useOptimistic, useTransition } from 'react';

import { notifyError } from '@/components/feedback/notify';
import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';

import type { ActionResult } from '@/lib/actions/action-result';

/**
 * Moves rows up or down at once and saves the new order in the background. The row moving is the confirmation;
 * if saving fails, the order snaps back and an error toast explains.
 */
export function useOptimisticOrder<T>(rows: T[], getId: (row: T) => string, saveOrder: (ids: string[]) => Promise<ActionResult>) {
  const [isSaving, startTransition] = useTransition();
  const [orderedRows, setOrderedRows] = useOptimistic(rows);

  const move = (index: number, offset: -1 | 1): void => {
    const target = index + offset;
    if (target < 0 || target >= orderedRows.length) {
      return;
    }
    const next = [...orderedRows];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) {
      return;
    }
    next.splice(target, 0, moved);
    startTransition(async () => {
      setOrderedRows(next);
      const result = await saveOrder(next.map(getId));
      if (!result.ok) {
        notifyError(result.formError ?? GENERIC_ERROR_MESSAGE);
      }
    });
  };

  return { orderedRows, move, isSaving };
}
