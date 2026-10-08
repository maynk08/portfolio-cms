'use client';

import { InstantSwitch } from '@/components/data-table/instant-switch';

import type { ActionResult } from '@/lib/actions/action-result';

type VisibilityToggleProps = {
  isVisible: boolean;
  // The item's name, for the switch label: `Show "Portfolio CMS" on the portfolio`.
  itemLabel: string;
  onChange: (isVisible: boolean) => Promise<ActionResult<unknown>>;
};

// The show/hide switch of every content list.
export function VisibilityToggle({ isVisible, itemLabel, onChange }: VisibilityToggleProps) {
  return <InstantSwitch checked={isVisible} label={`Show "${itemLabel}" on the portfolio`} onChange={onChange} />;
}
