'use server';

import { z } from 'zod';

import { runAction } from '@/lib/actions/action-result';
import { quoteLabel } from '@/lib/actions/resource-actions';
import { apiRequest } from '@/lib/api/api-client';
import { objectIdSchema } from '@/lib/validation/common-schemas';

import { MESSAGES_PATH, MESSAGE_STATUSES, messageSchema } from './schemas';

import type { MessageStatus } from './schemas';
import type { ActionResult } from '@/lib/actions/action-result';

const MAX_BULK = 100;
const NO_MESSAGE: ActionResult<never> = { ok: false, formError: 'This message no longer exists.' };
const NOTHING_SELECTED: ActionResult<never> = { ok: false, formError: 'Select at least one message (at most 100).' };

const statusSchema = z.enum(MESSAGE_STATUSES);
const idsSchema = z.array(objectIdSchema).min(1).max(MAX_BULK);

const STATUS_PHRASES: Record<MessageStatus, string> = {
  unread: 'marked as unread',
  read: 'marked as read',
  archived: 'archived',
};

function updateStatus(id: string, status: MessageStatus): Promise<unknown> {
  return apiRequest(`${MESSAGES_PATH}/${id}`, { method: 'PATCH', body: { status }, schema: messageSchema });
}

export async function setMessageStatus(id: unknown, status: unknown): Promise<ActionResult> {
  const messageId = objectIdSchema.safeParse(id);
  const newStatus = statusSchema.safeParse(status);
  if (!messageId.success || !newStatus.success) {
    return NO_MESSAGE;
  }
  return runAction(async () => {
    await updateStatus(messageId.data, newStatus.data);
    return null;
  }, `Message ${STATUS_PHRASES[newStatus.data]}`);
}

// Un-archiving puts a message back in the inbox as read.
export async function moveMessageToInbox(id: unknown): Promise<ActionResult> {
  const messageId = objectIdSchema.safeParse(id);
  if (!messageId.success) {
    return NO_MESSAGE;
  }
  return runAction(async () => {
    await updateStatus(messageId.data, 'read');
    return null;
  }, 'Message moved back to the inbox');
}

// Sent when the admin opens a message; no toast, the message simply stops being bold.
export async function markMessageRead(id: unknown): Promise<ActionResult> {
  const messageId = objectIdSchema.safeParse(id);
  if (!messageId.success) {
    return NO_MESSAGE;
  }
  return runAction(async () => {
    await updateStatus(messageId.data, 'read');
    return null;
  }, 'Message marked as read');
}

export async function deleteMessage(id: unknown, senderName: unknown): Promise<ActionResult> {
  const messageId = objectIdSchema.safeParse(id);
  if (!messageId.success) {
    return NO_MESSAGE;
  }
  return runAction(
    async () => {
      await apiRequest(`${MESSAGES_PATH}/${messageId.data}`, { method: 'DELETE', schema: z.null() });
      return null;
    },
    `Message from ${quoteLabel(senderName)} deleted`,
  );
}

function countPhrase(count: number): string {
  return count === 1 ? '1 message' : `${count} messages`;
}

// The backend changes one message at a time, so a selection is sent in parallel; it is at most one page.
export async function setMessagesStatus(ids: unknown, status: unknown): Promise<ActionResult> {
  const messageIds = idsSchema.safeParse(ids);
  const newStatus = statusSchema.safeParse(status);
  if (!messageIds.success || !newStatus.success) {
    return NOTHING_SELECTED;
  }
  return runAction(
    async () => {
      await Promise.all(messageIds.data.map((messageId) => updateStatus(messageId, newStatus.data)));
      return null;
    },
    `${countPhrase(messageIds.data.length)} ${STATUS_PHRASES[newStatus.data]}`,
  );
}

export async function deleteMessages(ids: unknown): Promise<ActionResult<{ deletedCount: number }>> {
  const messageIds = idsSchema.safeParse(ids);
  if (!messageIds.success) {
    return NOTHING_SELECTED;
  }
  return runAction(
    () =>
      apiRequest(`${MESSAGES_PATH}/bulk-delete`, {
        method: 'POST',
        body: { ids: messageIds.data },
        schema: z.object({ deletedCount: z.number() }),
      }),
    (result) => `${countPhrase(result.deletedCount)} deleted`,
  );
}
