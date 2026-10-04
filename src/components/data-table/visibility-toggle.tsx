'use client';

import { useOptimistic, useTransition } from 'react';

import { notifyResult } from '@/components/feedback/notify';
import { Switch } from '@/components/ui/switch';

import type { ActionResult } from '@/lib/actions/action-result';

type VisibilityToggleProps = {
  isVisible: boolean;
  // The item's name, for the switch label: `Show "Portfolio CMS" on the portfolio`.
  itemLabel: string;
  onChange: (isVisible: boolean) => Promise<ActionResult<unknown>>;
};

// Reversible, so it saves at once without confirmation; the switch moves immediately and snaps back if saving fails.
export function VisibilityToggle({ isVisible, itemLabel, onChange }: VisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [shownVisible, setShownVisible] = useOptimistic(isVisible);

  return (
    <Switch
      checked={shownVisible}
      aria-label={`Show "${itemLabel}" on the portfolio`}
      aria-busy={isPending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          setShownVisible(checked);
          notifyResult(await onChange(checked));
        });
      }}
    />
  );
}
