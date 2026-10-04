'use client';

import { useSyncExternalStore } from 'react';

import { formatTimestamp } from '@/lib/utils/format-date';

const subscribeToNothing = (): (() => void) => () => undefined;

// Formatted in the browser so it uses the viewer's time zone; the server render leaves the text empty.
export function Timestamp({ value }: { value: string }) {
  const isBrowser = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  return (
    <time dateTime={value} className="tabular-nums">
      {isBrowser ? formatTimestamp(value) : ''}
    </time>
  );
}
