'use client';

import Link from 'next/link';

import { useUnsavedChangesGuard } from '@/components/navigation/unsaved-changes';

import type { ComponentProps } from 'react';

type GuardedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

// An in-app link that asks before leaving a form with unsaved changes. Use it for every link inside the CMS.
export function GuardedLink({ href, onNavigate, ...props }: GuardedLinkProps) {
  const guard = useUnsavedChangesGuard();

  return (
    <Link
      href={href}
      onNavigate={(event) => {
        onNavigate?.(event);
        if (guard?.isBlocked() === true) {
          event.preventDefault();
          guard.confirmLeave(href);
        }
      }}
      {...props}
    />
  );
}
