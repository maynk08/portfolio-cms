'use client';

import { useRouter } from 'next/navigation';
import { createContext, use, useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/feedback/confirm-dialog';

import type { ReactNode } from 'react';

interface UnsavedChangesContextValue {
  // Registers a form with unsaved changes; returns the function that unregisters it.
  block: () => () => void;
  // True when leaving would lose changes; the caller then asks first via `confirmLeave`.
  isBlocked: () => boolean;
  confirmLeave: (href: string) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // A ref, not state: only link clicks read it, so changing it never needs a re-render.
  const blockers = useRef(new Set<symbol>());
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const value: UnsavedChangesContextValue = {
    block: () => {
      const token = Symbol('unsaved-form');
      blockers.current.add(token);
      return () => {
        blockers.current.delete(token);
      };
    },
    isBlocked: () => blockers.current.size > 0,
    confirmLeave: setPendingHref,
  };

  return (
    <UnsavedChangesContext value={value}>
      {children}
      <ConfirmDialog
        open={pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingHref(null);
          }
        }}
        title="Discard unsaved changes?"
        description="The changes on this page have not been saved and will be lost."
        confirmLabel="Discard changes"
        onConfirm={() => {
          if (pendingHref !== null) {
            blockers.current.clear();
            router.push(pendingHref);
          }
          return Promise.resolve(undefined);
        }}
      />
    </UnsavedChangesContext>
  );
}

export function useUnsavedChangesGuard(): UnsavedChangesContextValue | null {
  return use(UnsavedChangesContext);
}

/**
 * While `hasUnsavedChanges` is true: reloading or closing the tab shows the browser's warning, and in-app links
 * (`GuardedLink`) ask before leaving. The browser's Back button cannot be intercepted reliably and is not covered.
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): void {
  const guard = useUnsavedChangesGuard();

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }
    const unblock = guard?.block();
    const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      unblock?.();
    };
  }, [guard, hasUnsavedChanges]);
}
