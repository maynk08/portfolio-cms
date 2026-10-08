'use client';

import { useOptimistic, useTransition } from 'react';

import { notifyResult } from '@/components/feedback/notify';
import { Switch } from '@/components/ui/switch';

import type { ActionResult } from '@/lib/actions/action-result';

type InstantSwitchProps = {
  checked: boolean;
  // Names exactly what the switch does: `Show "Portfolio CMS" on the portfolio`, `Feature "Portfolio CMS" on the home page`.
  label: string;
  onChange: (checked: boolean) => Promise<ActionResult<unknown>>;
};

// A reversible setting that saves at once without confirmation; it moves immediately and snaps back if saving fails.
export function InstantSwitch({ checked, label, onChange }: InstantSwitchProps) {
  const [isPending, startTransition] = useTransition();
  const [shownChecked, setShownChecked] = useOptimistic(checked);

  return (
    <Switch
      checked={shownChecked}
      aria-label={label}
      aria-busy={isPending}
      onCheckedChange={(nextChecked) => {
        startTransition(async () => {
          setShownChecked(nextChecked);
          notifyResult(await onChange(nextChecked));
        });
      }}
    />
  );
}
