import 'server-only';

import { cache } from 'react';

import { apiRequest, apiRequestPage } from '@/lib/api/api-client';
import { ApiNotFoundError } from '@/lib/api/api-errors';
import { getResourcePage } from '@/lib/api/resource-queries';
import { OBJECT_ID_PATTERN } from '@/lib/validation/common-schemas';

import { MESSAGES_PATH, messageCountsSchema, messageSchema } from './schemas';

import type { Message, MessageCounts, MessageStatus } from './schemas';
import type { ApiPage } from '@/lib/api/api-client';
import type { ListParams } from '@/lib/utils/list-params';

export function getMessagePage(
  status: MessageStatus | undefined,
  list: { params: ListParams; pathname: string; searchParams: Record<string, string | string[] | undefined> },
): Promise<ApiPage<Message>> {
  return getResourcePage(MESSAGES_PATH, messageSchema, list, { status });
}

// Cached per request: the sidebar badge, the inbox tabs and the dashboard all use the counts.
export const getMessageCounts = cache((): Promise<MessageCounts> => apiRequest(`${MESSAGES_PATH}/counts`, { schema: messageCountsSchema }));

export function getLatestUnreadMessages(limit: number): Promise<ApiPage<Message>> {
  return apiRequestPage(MESSAGES_PATH, { itemSchema: messageSchema, query: { status: 'unread', page: 1, pageSize: limit } });
}

// The message for the reading panel; a deleted one (or a stale link) simply shows no panel.
export async function findMessage(id: string | null): Promise<Message | null> {
  if (id === null || !OBJECT_ID_PATTERN.test(id)) {
    return null;
  }
  try {
    return await apiRequest(`${MESSAGES_PATH}/${id}`, { schema: messageSchema });
  } catch (error) {
    if (error instanceof ApiNotFoundError) {
      return null;
    }
    throw error;
  }
}
