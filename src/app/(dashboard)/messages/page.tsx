import { PageHeader } from '@/components/layout/page-header';
import { MessagePanel } from '@/features/messages/components/message-panel';
import { MessageStatusTabs } from '@/features/messages/components/message-status-tabs';
import { MessagesTable } from '@/features/messages/components/messages-table';
import { findMessage, getMessageCounts, getMessagePage } from '@/features/messages/queries';
import { parseListParams } from '@/lib/utils/list-params';

import type { InboxView } from '@/features/messages/components/message-status-tabs';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Messages' };

function parseView(value: string | string[] | undefined): InboxView {
  return value === 'read' || value === 'archived' || value === 'all' ? value : 'unread';
}

export default async function MessagesPage({ searchParams }: PageProps<'/messages'>) {
  const query = await searchParams;
  const view = parseView(query.status);
  const openId = typeof query.message === 'string' ? query.message : null;

  const [page, counts, openMessage] = await Promise.all([
    getMessagePage(view === 'all' ? undefined : view, { params: parseListParams(query), pathname: '/messages', searchParams: query }),
    getMessageCounts(),
    findMessage(openId),
  ]);

  return (
    <>
      <PageHeader title="Messages" description="Sent through the contact form on the portfolio, newest first." />
      <MessageStatusTabs current={view} counts={counts} />
      <MessagesTable key={view} page={page} view={view} />
      {openMessage !== null && <MessagePanel key={openMessage.id} message={openMessage} />}
    </>
  );
}
