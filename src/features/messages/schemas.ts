import { z } from 'zod';

export const MESSAGES_PATH = '/messages';
export const MESSAGE_STATUSES = ['unread', 'read', 'archived'] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const messageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  subject: z.string().nullish(),
  message: z.string(),
  status: z.enum(MESSAGE_STATUSES),
  createdAt: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

export const messageCountsSchema = z.object({ unread: z.number(), read: z.number(), archived: z.number() });

export type MessageCounts = z.infer<typeof messageCountsSchema>;

// "Message from Ada" (used in toasts and confirmations).
export function describeMessage(message: Pick<Message, 'name'>): string {
  return `Message from ${message.name}`;
}

// The subject, or the start of the message when there is none.
export function messagePreview(message: Pick<Message, 'subject' | 'message'>): string {
  const subject = message.subject?.trim() ?? '';
  return subject === '' ? message.message.replace(/\s+/g, ' ').trim() : subject;
}

// Opens the admin's mail app with a reply to the sender.
export function replyHref(message: Pick<Message, 'email' | 'subject'>): string {
  const subject = message.subject?.trim() ?? '';
  const replySubject = subject === '' ? 'Re: your message' : subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
  return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(replySubject)}`;
}
