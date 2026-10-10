import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDashboardSummary } from '@/features/dashboard/queries';
import { deleteMessages, markMessageRead, moveMessageToInbox, setMessageStatus, setMessagesStatus } from '@/features/messages/actions';
import { messagePreview, replyHref } from '@/features/messages/schemas';
import { apiRequest, apiRequestAll, apiRequestPage } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({ apiRequest: vi.fn(), apiRequestPage: vi.fn(), apiRequestAll: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);
const A = 'a'.repeat(24);
const B = 'b'.repeat(24);

beforeEach(() => {
  apiRequestMock.mockReset();
  vi.mocked(apiRequestPage).mockReset();
  vi.mocked(apiRequestAll).mockReset();
});

describe('message helpers', () => {
  it('previews the subject, or the start of the message without line breaks', () => {
    expect(messagePreview({ subject: 'Job offer', message: 'Hi' })).toBe('Job offer');
    expect(messagePreview({ subject: null, message: 'Hello\n\nthere' })).toBe('Hello there');
  });

  it('replies to the sender with "Re:" once', () => {
    expect(replyHref({ email: 'ada@example.com', subject: 'Job offer' })).toBe('mailto:ada%40example.com?subject=Re%3A%20Job%20offer');
    expect(replyHref({ email: 'ada@example.com', subject: 'Re: Job offer' })).toBe('mailto:ada%40example.com?subject=Re%3A%20Job%20offer');
    expect(replyHref({ email: 'ada@example.com', subject: null })).toBe('mailto:ada%40example.com?subject=Re%3A%20your%20message');
  });
});

describe('message actions', () => {
  it('changes one message and says what happened', async () => {
    apiRequestMock.mockResolvedValue({});

    expect(await setMessageStatus(A, 'archived')).toMatchObject({ ok: true, message: 'Message archived' });
    expect(await moveMessageToInbox(A)).toMatchObject({ ok: true, message: 'Message moved back to the inbox' });
    expect(apiRequestMock).toHaveBeenLastCalledWith(
      `/messages/${A}`,
      expect.objectContaining({ method: 'PATCH', body: { status: 'read' } }),
    );
    expect(await markMessageRead(A)).toMatchObject({ ok: true });
  });

  it('changes a selection one message at a time, in parallel', async () => {
    apiRequestMock.mockResolvedValue({});

    expect(await setMessagesStatus([A, B], 'read')).toMatchObject({ ok: true, message: '2 messages marked as read' });
    expect(apiRequestMock).toHaveBeenCalledTimes(2);
  });

  it('deletes a selection at once and reports how many went', async () => {
    apiRequestMock.mockResolvedValue({ deletedCount: 1 });

    expect(await deleteMessages([A, B])).toMatchObject({ ok: true, message: '1 message deleted' });
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/messages/bulk-delete',
      expect.objectContaining({ method: 'POST', body: { ids: [A, B] } }),
    );
  });

  it('refuses an empty selection, malformed IDs and unknown statuses without calling the backend', async () => {
    expect(await setMessagesStatus([], 'read')).toMatchObject({ ok: false });
    expect(await deleteMessages(['nope'])).toMatchObject({ ok: false });
    expect(await setMessageStatus(A, 'deleted')).toMatchObject({ ok: false });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});

describe('getDashboardSummary', () => {
  it('reads totals from first pages and counts featured projects and hidden sections', async () => {
    const totals: Record<string, number> = {
      '/experiences': 3,
      '/skill-groups': 2,
      '/education': 1,
      '/certifications': 4,
      '/media': 9,
      '/messages': 1,
    };
    vi.mocked(apiRequestPage).mockImplementation((path) =>
      Promise.resolve({
        items: path === '/messages' ? [{ id: A }] : [],
        pagination: { page: 1, pageSize: 1, totalItems: totals[path] ?? 0, totalPages: 1 },
      }),
    );
    vi.mocked(apiRequestAll).mockResolvedValue([{ isFeatured: true }, { isFeatured: false }]);
    apiRequestMock.mockImplementation((path) =>
      Promise.resolve(path === '/messages/counts' ? { unread: 1, read: 2, archived: 0 } : [{ isVisible: true }, { isVisible: false }]),
    );

    const summary = await getDashboardSummary();

    expect(summary.totals).toEqual({
      experience: 3,
      projects: 2,
      featuredProjects: 1,
      skillGroups: 2,
      education: 1,
      certifications: 4,
      media: 9,
    });
    expect(summary.sections).toEqual({ total: 2, hidden: 1 });
    expect(summary.messageCounts.unread).toBe(1);
    expect(summary.latestUnread).toEqual([{ id: A }]);
  });
});
