import { expect, test } from '@playwright/test';

import { e2eConfig } from '../e2e-config';
import { logIn } from './helpers';

// One flow in steps: if a step fails, the rest are skipped rather than re-run with the messages sent twice.
test.describe.configure({ mode: 'serial' });

const CONTACT_URL = `http://localhost:${e2eConfig.backendPort}/api/public/messages`;

const MESSAGES = [
  { name: 'Ada', email: 'ada@example.com', subject: 'Job offer', message: 'We would like to talk about a role.' },
  { name: 'Bob', email: 'bob@example.com', message: 'Loved your projects!' },
  { name: 'Cy', email: 'cy@example.com', subject: 'Question', message: 'How did you build the CMS?' },
];

// Sends messages the way the portfolio's contact form does, each from its own address so the per-IP limit is not hit.
test.beforeAll(async ({ request }) => {
  for (const [index, message] of MESSAGES.entries()) {
    const response = await request.post(CONTACT_URL, { data: message, headers: { 'X-Forwarded-For': `10.9.0.${index + 1}` } });
    expect(response.status()).toBe(201);
  }
});

test('shows new messages on the dashboard and in the sidebar', async ({ page }) => {
  await logIn(page);

  await expect(page.getByRole('heading', { name: '3 unread messages' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Newest unread messages' }).getByRole('listitem')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Messages (3 unread)' })).toBeVisible();
});

test('reads, archives and deletes messages', async ({ page }) => {
  await logIn(page, undefined, '/messages');
  const tabs = page.getByRole('navigation', { name: 'Message views' });
  await expect(tabs).toContainText('Unread (3)');

  await page.getByRole('link', { name: /^Ada/ }).click();
  const panel = page.getByRole('dialog', { name: 'Job offer' });
  await expect(panel).toContainText('We would like to talk about a role.');
  await expect(panel.getByRole('link', { name: 'Reply by email' })).toHaveAttribute(
    'href',
    /^mailto:ada%40example\.com\?subject=Re%3A%20Job%20offer$/,
  );
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  // Opening the message marked it as read (the page behind the panel is hidden from assistive tech while it is open).
  await expect(tabs).toContainText('Unread (2)');

  await page.getByRole('button', { name: 'Archive "Message from Bob"' }).click();
  await expect(page.getByText('Message archived')).toBeVisible();
  await expect(tabs).toContainText('Archived (1)');

  await page.getByRole('link', { name: /^All/ }).click();
  await page.getByRole('checkbox', { name: 'Select all rows on this page' }).click();
  await page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Delete' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Delete 3 selected messages?' });
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('3 messages deleted')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No messages yet' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No unread messages' })).toBeVisible();
});
