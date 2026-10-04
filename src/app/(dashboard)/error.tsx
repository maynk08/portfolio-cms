'use client';

import { ErrorState } from '@/components/feedback/error-state';

// Server error details never reach the browser, so the message stays general and points at the likely cause.
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState title="This page could not be loaded" description="Check that the backend is running, then try again." onRetry={reset} />
  );
}
