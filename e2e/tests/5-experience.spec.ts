import { expect, test } from '@playwright/test';

import { deleteRow, logIn, pickMonth } from './helpers';

test.beforeEach(async ({ page }) => {
  await logIn(page, undefined, '/experience');
});

test('creates, edits, hides and deletes a job', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'No experience yet' })).toBeVisible();
  await page.getByRole('link', { name: 'Add experience' }).first().click();
  await expect(page).toHaveURL(/\/experience\/new$/);

  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Engineer');
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill('Acme');
  await pickMonth(page, 'Started', 2022, 'March');
  await page.getByRole('checkbox', { name: 'I currently work here' }).check();
  await page.getByRole('button', { name: 'Add highlight' }).click();
  await page.getByRole('textbox', { name: 'Highlight 1' }).fill('Shipped the new checkout');
  await page.getByRole('textbox', { name: 'Tech stack', exact: true }).fill('TypeScript');
  await page.getByRole('textbox', { name: 'Tech stack', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Create experience' }).click();

  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.getByText('Experience "Engineer at Acme" created')).toBeVisible();
  await expect(page.getByRole('row', { name: /Engineer/ })).toContainText('Mar 2022 – Present');

  await page.getByRole('link', { name: 'Edit "Engineer at Acme"' }).click();
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Senior Engineer');
  await page.getByRole('button', { name: 'Save experience' }).click();
  await expect(page.getByText('Experience "Senior Engineer at Acme" saved')).toBeVisible();
  await expect(page).toHaveURL(/\/experience\/[a-f\d]{24}$/);

  await page.getByRole('link', { name: 'Experience' }).last().click();
  await page.getByRole('switch', { name: 'Show "Senior Engineer at Acme" on the portfolio' }).click();
  await expect(page.getByText('hidden from the portfolio')).toBeVisible();

  await deleteRow(page, 'Senior Engineer at Acme');
  await expect(page.getByText('Experience "Senior Engineer at Acme" deleted')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No experience yet' })).toBeVisible();
});

test('refuses an end month before the start month', async ({ page }) => {
  await page.goto('/experience/new');
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Intern');
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill('Acme');
  await pickMonth(page, 'Started', 2023, 'May');
  await pickMonth(page, 'Left', 2023, 'January');
  await page.getByRole('button', { name: 'Create experience' }).click();

  await expect(page.getByText('The end month cannot be before the start month')).toBeVisible();
  await expect(page).toHaveURL(/\/experience\/new$/);
});
