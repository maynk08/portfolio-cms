import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    // Rendered inside the dashboard for unknown pages, so it fills the content area instead of the whole screen.
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page does not exist or has moved.</p>
      <Button asChild>
        <GuardedLink href="/">Go to the dashboard</GuardedLink>
      </Button>
    </div>
  );
}
