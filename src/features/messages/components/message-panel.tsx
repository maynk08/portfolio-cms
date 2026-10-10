'use client';

import { ArchiveIcon, InboxIcon, MailIcon, ReplyIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { notifyResult } from '@/components/feedback/notify';
import { StatusBadge } from '@/components/feedback/status-badge';
import { Timestamp } from '@/components/feedback/timestamp';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { deleteMessage, moveMessageToInbox, setMessageStatus } from '@/features/messages/actions';
import { replyHref } from '@/features/messages/schemas';
import { useQueryParamHref } from '@/hooks/use-query-param-href';

import type { Message } from '@/features/messages/schemas';
import type { ActionResult } from '@/lib/actions/action-result';

// Reading one message over the inbox: the whole text, reply by email, and the same actions as the list.
export function MessagePanel({ message }: { message: Message }) {
  const router = useRouter();
  const messageHref = useQueryParamHref('message');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isRunning, startRunning] = useTransition();
  const subject = message.subject?.trim() ?? '';

  const close = (): void => {
    router.push(messageHref(null), { scroll: false });
  };

  const run = (action: () => Promise<ActionResult>, closeAfter = false): void => {
    startRunning(async () => {
      const result = await action();
      notifyResult(result);
      if (result.ok && closeAfter) {
        close();
      }
    });
  };

  return (
    <>
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{subject === '' ? 'No subject' : subject}</SheetTitle>
            <SheetDescription>
              From {message.name} ({message.email}), <Timestamp value={message.createdAt} />
            </SheetDescription>
            <div>
              <StatusBadge status={message.status} />
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-4 pb-6">
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.message}</p>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button asChild>
                <a href={replyHref(message)}>
                  <ReplyIcon aria-hidden />
                  Reply by email
                </a>
              </Button>
              {message.status === 'archived' ? (
                <Button
                  variant="outline"
                  disabled={isRunning}
                  onClick={() => {
                    run(() => moveMessageToInbox(message.id));
                  }}
                >
                  <InboxIcon aria-hidden />
                  Move to inbox
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={isRunning}
                  onClick={() => {
                    run(() => setMessageStatus(message.id, 'archived'), true);
                  }}
                >
                  <ArchiveIcon aria-hidden />
                  Archive
                </Button>
              )}
              {message.status !== 'unread' && (
                <Button
                  variant="outline"
                  disabled={isRunning}
                  onClick={() => {
                    run(() => setMessageStatus(message.id, 'unread'), true);
                  }}
                >
                  <MailIcon aria-hidden />
                  Mark as unread
                </Button>
              )}
              <Button
                variant="destructive"
                disabled={isRunning}
                onClick={() => {
                  setIsConfirmingDelete(true);
                }}
              >
                <Trash2Icon aria-hidden />
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={`Delete the message from ${message.name}?`}
        description="It will be removed for good. This cannot be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        onConfirm={() => deleteMessage(message.id, message.name)}
        onSuccess={close}
      />
    </>
  );
}
