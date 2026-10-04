import { expect, test } from '@playwright/test';

import { logIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await logIn(page, undefined, '/profile');
});

test('saves the profile and keeps it after a reload', async ({ page }) => {
  await page.getByLabel(/^Name/).fill('Ada Lovelace');
  await page.getByLabel(/^Headline/).fill('Full-stack engineer');
  await page.getByRole('button', { name: 'Add phrase' }).click();
  await page.getByRole('textbox', { name: 'Phrase 1' }).fill('I build web apps');

  await page.getByRole('button', { name: 'Add social link' }).click();
  const link = page.getByRole('listitem', { name: 'Social link 1' });
  await link.getByRole('combobox', { name: /^Platform/ }).click();
  await page.getByRole('option', { name: 'Email' }).click();
  await link.getByLabel(/^Email address/).fill('ada@example.com');

  await page.getByLabel('Location', { exact: true }).fill('London');
  await page.getByRole('switch', { name: 'Show location on portfolio' }).click();

  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(/^Name/)).toHaveValue('Ada Lovelace');
  await expect(page.getByRole('textbox', { name: 'Phrase 1' })).toHaveValue('I build web apps');
  // Stored as a mailto: link, shown as the plain address.
  await expect(page.getByRole('listitem', { name: 'Social link 1' }).getByLabel(/^Email address/)).toHaveValue('ada@example.com');
  await expect(page.getByLabel('Location', { exact: true })).toHaveValue('London');
  await expect(page.getByRole('switch', { name: 'Show location on portfolio' })).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Show link 1 on portfolio' })).toBeChecked();
});

test('shows errors next to the fields and does not save', async ({ page }) => {
  await page.getByLabel(/^Name/).fill('');
  await page.getByRole('button', { name: 'Save profile' }).click();

  await expect(page.getByText('Enter your name')).toBeVisible();
  await expect(page.getByLabel(/^Name/)).toBeFocused();
});

test('asks before leaving with unsaved changes, and discards them on request', async ({ page }) => {
  await page.getByLabel(/^Headline/).fill('Something unsaved');
  await page.getByRole('link', { name: 'Sections' }).click();

  const dialog = page.getByRole('alertdialog', { name: 'Discard unsaved changes?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.getByRole('button', { name: 'Discard changes' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.getByLabel(/^Headline/)).toHaveValue('Full-stack engineer');
});
