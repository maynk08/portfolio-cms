'use client';

import { ArchiveIcon, InboxIcon, MailIcon, MailOpenIcon, Trash2Icon } from 'lucide-react';
import { useState, useTransition } from 'react';

import { BulkActionBar } from '@/components/data-table/bulk-action-bar';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { RowActions } from '@/components/data-table/row-actions';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { EmptyState } from '@/components/feedback/empty-state';
import { notifyResult } from '@/components/feedback/notify';
import { StatusBadge } from '@/components/feedback/status-badge';
import { Timestamp } from '@/components/feedback/timestamp';
import { TruncatedText } from '@/components/feedback/truncated-text';
import { Button } from '@/components/ui/button';
import { deleteMessage, deleteMessages, moveMessageToInbox, setMessageStatus, setMessagesStatus } from '@/features/messages/actions';
import { MessageLink } from '@/features/messages/components/message-link';
import { describeMessage, messagePreview } from '@/features/messages/schemas';
import { useQueryParamHref } from '@/hooks/use-query-param-href';
import { cn } from '@/lib/utils/cn';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { InboxView } from '@/features/messages/components/message-status-tabs';
import type { Message } from '@/features/messages/schemas';
import type { ActionResult } from '@/lib/actions/action-result';
import type { ApiPage } from '@/lib/api/api-client';

const EMPTY_TEXT: Record<InboxView, { title: string; description: string }> = {
  unread: { title: 'No unread messages', description: 'New messages from the contact form appear here.' },
  read: { title: 'No read messages', description: 'Messages you have opened appear here.' },
  archived: { title: 'No archived messages', description: 'Archive messages you want to keep out of the way.' },
  all: { title: 'No messages yet', description: 'Messages sent through the portfolio’s contact form appear here.' },
};

const itemNoun = { singular: 'message', plural: 'messages' };

export function MessagesTable({ page, view }: { page: ApiPage<Message>; view: InboxView }) {
  const messageHref = useQueryParamHref('message');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  const [isRunning, startRunning] = useTransition();
  // Only messages still on this page count as selected (after a change, some may have moved to another view).
  const selected = page.items.filter((message) => selectedIds.has(message.id)).map((message) => message.id);

  const run = (action: () => Promise<ActionResult<unknown>>, clearSelection = false): void => {
    startRunning(async () => {
      const result = await action();
      notifyResult(result);
      if (result.ok && clearSelection) {
        setSelectedIds(new Set());
      }
    });
  };

  const columns: DataTableColumn<Message>[] = [
    {
      id: 'from',
      header: 'From',
      cell: (message) => (
        <MessageLink
          message={message}
          href={messageHref(message.id)}
          className="flex flex-col rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn(message.status === 'unread' && 'font-semibold')}>{message.name}</span>
          <span className="text-muted-foreground">{message.email}</span>
        </MessageLink>
      ),
    },
    {
      id: 'subject',
      header: 'Subject',
      isSecondary: true,
      cell: (message) => (
        <TruncatedText text={messagePreview(message)} className={cn('max-w-sm', message.status === 'unread' && 'font-semibold')} />
      ),
    },
    { id: 'received', header: 'Received', cell: (message) => <Timestamp value={message.createdAt} /> },
    { id: 'status', header: 'Status', isSecondary: true, cell: (message) => <StatusBadge status={message.status} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <BulkActionBar
        selectedCount={selected.length}
        itemNoun={itemNoun}
        onClearSelection={() => {
          setSelectedIds(new Set());
        }}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={isRunning}
          onClick={() => {
            run(() => setMessagesStatus(selected, 'read'), true);
          }}
        >
          <MailOpenIcon aria-hidden />
          Mark as read
        </Button>
        {view !== 'archived' && (
          <Button
            variant="outline"
            size="sm"
            disabled={isRunning}
            onClick={() => {
              run(() => setMessagesStatus(selected, 'archived'), true);
            }}
          >
            <ArchiveIcon aria-hidden />
            Archive
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          disabled={isRunning}
          onClick={() => {
            setIsConfirmingBulkDelete(true);
          }}
        >
          <Trash2Icon aria-hidden />
          Delete
        </Button>
      </BulkActionBar>

      <DataTable
        caption="Messages"
        columns={columns}
        rows={page.items}
        getRowId={(message) => message.id}
        getRowLabel={describeMessage}
        selection={{ selectedIds, onChange: setSelectedIds }}
        isRefreshing={isRunning}
        emptyState={<EmptyState icon={InboxIcon} {...EMPTY_TEXT[view]} />}
        rowActions={(message) => (
          <RowActions
            itemLabel={describeMessage(message)}
            actions={[
              message.status === 'unread'
                ? {
                    label: 'Mark as read',
                    icon: MailOpenIcon,
                    onSelect: () => {
                      run(() => setMessageStatus(message.id, 'read'));
                    },
                  }
                : {
                    label: 'Mark as unread',
                    icon: MailIcon,
                    onSelect: () => {
                      run(() => setMessageStatus(message.id, 'unread'));
                    },
                  },
              message.status === 'archived'
                ? {
                    label: 'Move to inbox',
                    icon: InboxIcon,
                    onSelect: () => {
                      run(() => moveMessageToInbox(message.id));
                    },
                  }
                : {
                    label: 'Archive',
                    icon: ArchiveIcon,
                    onSelect: () => {
                      run(() => setMessageStatus(message.id, 'archived'));
                    },
                  },
            ]}
            destructiveActions={[
              {
                label: 'Delete',
                icon: Trash2Icon,
                confirm: {
                  title: `Delete the message from ${message.name}?`,
                  description: 'It will be removed for good. This cannot be undone.',
                  confirmLabel: 'Delete',
                  pendingLabel: 'Deleting…',
                },
                onConfirm: () => deleteMessage(message.id, message.name),
              },
            ]}
          />
        )}
      />
      <DataTablePagination pagination={page.pagination} itemNoun={itemNoun} />

      <ConfirmDialog
        open={isConfirmingBulkDelete}
        onOpenChange={setIsConfirmingBulkDelete}
        title={`Delete ${selected.length === 1 ? '1 selected message' : `${selected.length} selected messages`}?`}
        description="They will be removed for good. This cannot be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        onConfirm={() => deleteMessages(selected)}
        onSuccess={() => {
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
