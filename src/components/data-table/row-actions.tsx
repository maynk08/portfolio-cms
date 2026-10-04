'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { Fragment, useState } from 'react';

import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { ConfirmDialogProps } from '@/components/feedback/confirm-dialog';
import type { ActionResult } from '@/lib/actions/action-result';
import type { LucideIcon } from 'lucide-react';

const MAX_INLINE_ACTIONS = 3;

interface BaseRowAction {
  label: string;
  icon: LucideIcon;
  // Set when the action cannot be used right now; the action stays visible, disabled, with this explanation.
  disabledReason?: string;
}

export type RowAction = BaseRowAction & ({ href: string } | { onSelect: () => void });

export interface DestructiveRowAction extends BaseRowAction {
  confirm: Pick<ConfirmDialogProps, 'title' | 'description' | 'confirmLabel' | 'pendingLabel' | 'children'>;
  onConfirm: () => Promise<ActionResult<unknown>>;
}

type RowActionsProps = {
  // The row's name, for button labels: `Edit "Portfolio CMS"`.
  itemLabel: string;
  // In display order; the first three are buttons, the rest go into the ⋮ menu.
  actions: RowAction[];
  // Always in the ⋮ menu, separated from the others, and always confirmed first.
  destructiveActions?: DestructiveRowAction[];
};

function InlineAction({ action, itemLabel }: { action: RowAction; itemLabel: string }) {
  const accessibleLabel = `${action.label} "${itemLabel}"`;
  const icon = <action.icon aria-hidden />;

  if (action.disabledReason !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A disabled button cannot show a tooltip, so the wrapper takes focus and hover instead. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the reason must be reachable by keyboard */}
          <span tabIndex={0} aria-label={`${accessibleLabel}: ${action.disabledReason}`}>
            <Button variant="ghost" size="icon-sm" disabled aria-hidden tabIndex={-1}>
              {icon}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{action.disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {'href' in action ? (
          <Button variant="ghost" size="icon-sm" asChild>
            <GuardedLink href={action.href} aria-label={accessibleLabel}>
              {icon}
            </GuardedLink>
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label={accessibleLabel} onClick={action.onSelect}>
            {icon}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{action.label}</TooltipContent>
    </Tooltip>
  );
}

function MenuActionContent({ action }: { action: BaseRowAction }) {
  return (
    <>
      <action.icon aria-hidden />
      <span className="flex flex-col">
        {action.label}
        {action.disabledReason !== undefined && <span className="text-xs text-muted-foreground">{action.disabledReason}</span>}
      </span>
    </>
  );
}

export function RowActions({ itemLabel, actions, destructiveActions = [] }: RowActionsProps) {
  const [confirming, setConfirming] = useState<DestructiveRowAction | null>(null);
  const inlineActions = actions.slice(0, MAX_INLINE_ACTIONS);
  const menuActions = actions.slice(MAX_INLINE_ACTIONS);
  const hasMenu = menuActions.length > 0 || destructiveActions.length > 0;

  return (
    <div className="flex items-center justify-end gap-1">
      {inlineActions.map((action) => (
        <InlineAction key={action.label} action={action} itemLabel={itemLabel} />
      ))}

      {hasMenu && (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`More actions for "${itemLabel}"`}>
                  <MoreHorizontalIcon aria-hidden />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="min-w-44">
            {menuActions.map((action) =>
              'href' in action && action.disabledReason === undefined ? (
                <DropdownMenuItem key={action.label} asChild>
                  <GuardedLink href={action.href}>
                    <MenuActionContent action={action} />
                  </GuardedLink>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={action.label}
                  disabled={action.disabledReason !== undefined}
                  onSelect={'onSelect' in action ? action.onSelect : undefined}
                >
                  <MenuActionContent action={action} />
                </DropdownMenuItem>
              ),
            )}
            {destructiveActions.length > 0 && (
              <Fragment>
                {menuActions.length > 0 && <DropdownMenuSeparator />}
                {destructiveActions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    variant="destructive"
                    disabled={action.disabledReason !== undefined}
                    onSelect={() => {
                      setConfirming(action);
                    }}
                  >
                    <MenuActionContent action={action} />
                  </DropdownMenuItem>
                ))}
              </Fragment>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {confirming !== null && (
        <ConfirmDialog
          {...confirming.confirm}
          open
          onOpenChange={(open) => {
            if (!open) {
              setConfirming(null);
            }
          }}
          onConfirm={confirming.onConfirm}
        />
      )}
    </div>
  );
}
