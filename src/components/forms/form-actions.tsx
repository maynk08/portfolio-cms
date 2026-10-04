import { cn } from '@/lib/utils/cn';

import type { ReactNode } from 'react';

type FormActionsProps = {
  hasUnsavedChanges: boolean;
  // Cancel (a link back to the list) or Discard changes; always left of Save.
  secondaryAction: ReactNode;
  // `sticky` on form pages; `card` in the footer of a card on pages with several small forms.
  placement: 'sticky' | 'card';
  submitButton: ReactNode;
};

// Save is always the last button on the right, so it sits in the same place on every form.
export function FormActions({ hasUnsavedChanges, secondaryAction, placement, submitButton }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        placement === 'sticky' && 'sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6',
        placement === 'card' && 'border-t pt-4',
      )}
    >
      {hasUnsavedChanges && (
        <span role="status" className="mr-auto text-sm text-muted-foreground">
          Unsaved changes
        </span>
      )}
      {secondaryAction}
      {submitButton}
    </div>
  );
}
