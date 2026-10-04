'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';

// Server error details never reach the browser, so the message stays general and points at the likely cause.
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <PageHeader title="This page could not be loaded" description="Check that the backend is running, then try again." />
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
