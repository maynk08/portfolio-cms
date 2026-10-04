'use client';

import '@/styles/globals.css';

// Replaces the root layout when it fails, so it renders its own <html> and stays dependency-free.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">The CMS could not be loaded. Try again in a moment.</p>
        <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Try again
        </button>
      </body>
    </html>
  );
}
