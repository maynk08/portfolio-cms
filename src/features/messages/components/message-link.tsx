'use client';

import Link from 'next/link';

import { notifyError, notifyResult } from '@/components/feedback/notify';
import { markMessageRead } from '@/features/messages/actions';

import type { Message } from '@/features/messages/schemas';
import type { ReactNode } from 'react';

type MessageLinkProps = {
  message: Pick<Message, 'id' | 'status'>;
  // The inbox URL that opens this message's panel.
  href: string;
  className?: string;
  children: ReactNode;
};

// Opens a message; opening an unread one marks it as read (the inbox and the badge refresh once that is saved).
export function MessageLink({ message, href, className, children }: MessageLinkProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={() => {
        if (message.status !== 'unread') {
          return;
        }
        markMessageRead(message.id).then(
          (result) => {
            if (!result.ok) {
              notifyResult(result);
            }
          },
          () => {
            notifyError('The message could not be marked as read.');
          },
        );
      }}
    >
      {children}
    </Link>
  );
}
