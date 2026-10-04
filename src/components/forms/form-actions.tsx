import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';

type FormActionsProps = {
  cancelHref: string;
  submitLabel: string;
  isPending: boolean;
  hasUnsavedChanges: boolean;
};

// Sticks to the bottom of the screen on every form page, so Save is always in the same place and always in reach.
export function FormActions({ cancelHref, submitLabel, isPending, hasUnsavedChanges }: FormActionsProps) {
  return (
    <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      {hasUnsavedChanges && (
        <span role="status" className="mr-auto text-sm text-muted-foreground">
          Unsaved changes
        </span>
      )}
      <Button variant="outline" asChild>
        <GuardedLink href={cancelHref}>Cancel</GuardedLink>
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}
