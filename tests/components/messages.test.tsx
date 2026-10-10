// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MessagePanel } from '@/features/messages/components/message-panel';
import { MessagesTable } from '@/features/messages/components/messages-table';

import { navigationState, resetNavigationMocks, routerMock } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { Message } from '@/features/messages/schemas';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/messages/actions', () => ({
  deleteMessage: vi.fn(),
  deleteMessages: vi.fn(),
  markMessageRead: vi.fn(),
  moveMessageToInbox: vi.fn(),
  setMessageStatus: vi.fn(),
  setMessagesStatus: vi.fn(),
}));

const actions = await import('@/features/messages/actions');

function message(id: string, name: string, status: Message['status'] = 'unread'): Message {
  return {
    id: id.repeat(24),
    name,
    email: `${name.toLowerCase()}@example.com`,
    subject: `Hello from ${name}`,
    message: 'Text',
    status,
    createdAt: '2026-10-11T10:00:00.000Z',
  };
}

const page = (items: Message[]) => ({ items, pagination: { page: 1, pageSize: 20, totalItems: items.length, totalPages: 1 } });

beforeEach(() => {
  resetNavigationMocks();
  navigationState.pathname = '/messages';
  vi.mocked(toast.success).mockClear();
  for (const action of Object.values(actions)) {
    vi.mocked(action).mockReset();
  }
});

describe('MessagesTable', () => {
  it('opens a message and marks it as read only when it was unread', async () => {
    vi.mocked(actions.markMessageRead).mockResolvedValue({ ok: true, message: '', data: null });
    const { user } = renderWithProviders(<MessagesTable page={page([message('a', 'Ada'), message('b', 'Bob', 'read')])} view="all" />);

    await user.click(screen.getByRole('link', { name: /Ada/ }));
    expect(routerMock.push).toHaveBeenCalledWith(`/messages?message=${'a'.repeat(24)}`);
    expect(actions.markMessageRead).toHaveBeenCalledWith('a'.repeat(24));

    await user.click(screen.getByRole('link', { name: /Bob/ }));
    expect(actions.markMessageRead).toHaveBeenCalledTimes(1);
  });

  it('deletes a selection after confirming with the count', async () => {
    vi.mocked(actions.deleteMessages).mockResolvedValue({ ok: true, message: '2 messages deleted', data: { deletedCount: 2 } });
    const { user } = renderWithProviders(<MessagesTable page={page([message('a', 'Ada'), message('b', 'Bob')])} view="unread" />);

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    const bar = screen.getByRole('region', { name: 'Bulk actions' });
    expect(bar).toHaveTextContent('2 messages selected');
    await user.click(within(bar).getByRole('button', { name: 'Delete' }));

    const confirm = await screen.findByRole('alertdialog', { name: 'Delete 2 selected messages?' });
    expect(actions.deleteMessages).not.toHaveBeenCalled();
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('2 messages deleted');
    });
    expect(actions.deleteMessages).toHaveBeenCalledWith(['a'.repeat(24), 'b'.repeat(24)]);
  });

  it('archives a selection straight away, without asking', async () => {
    vi.mocked(actions.setMessagesStatus).mockResolvedValue({ ok: true, message: '1 message archived', data: null });
    const { user } = renderWithProviders(<MessagesTable page={page([message('a', 'Ada')])} view="unread" />);

    await user.click(screen.getByRole('checkbox', { name: 'Select "Message from Ada"' }));
    await user.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('1 message archived');
    });
    expect(actions.setMessagesStatus).toHaveBeenCalledWith(['a'.repeat(24)], 'archived');
  });

  it('says when a view is empty', () => {
    renderWithProviders(<MessagesTable page={page([])} view="unread" />);

    expect(screen.getByRole('heading', { name: 'No unread messages' })).toBeInTheDocument();
  });
});

describe('MessagePanel', () => {
  it('shows the message with a reply link, and closes after archiving', async () => {
    vi.mocked(actions.setMessageStatus).mockResolvedValue({ ok: true, message: 'Message archived', data: null });
    navigationState.searchParams = new URLSearchParams(`message=${'a'.repeat(24)}`);
    const { user } = renderWithProviders(<MessagePanel message={message('a', 'Ada', 'read')} />);

    const panel = screen.getByRole('dialog', { name: 'Hello from Ada' });
    expect(within(panel).getByRole('link', { name: 'Reply by email' })).toHaveAttribute(
      'href',
      'mailto:ada%40example.com?subject=Re%3A%20Hello%20from%20Ada',
    );
    await user.click(within(panel).getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith('/messages', { scroll: false });
    });
    expect(actions.setMessageStatus).toHaveBeenCalledWith('a'.repeat(24), 'archived');
  });

  it('offers to move an archived message back to the inbox', () => {
    renderWithProviders(<MessagePanel message={message('a', 'Ada', 'archived')} />);

    expect(screen.getByRole('button', { name: 'Move to inbox' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });
});
