import { expect, test } from '@playwright/test';

import { logIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await logIn(page, undefined, '/sections');
});

test('renames a section', async ({ page }) => {
  await page.getByRole('button', { name: 'Rename "About"' }).click();
  const dialog = page.getByRole('dialog', { name: 'Rename the About section' });
  await dialog.getByLabel(/^Heading/).fill('About me');
  await dialog.getByRole('button', { name: 'Rename' }).click();

  await expect(page.getByText('About section renamed to "About me"')).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('cell', { name: 'About me', exact: true })).toBeVisible();
});

test('hides a section and keeps it hidden after a reload', async ({ page }) => {
  const toggle = page.getByRole('switch', { name: 'Show "Skills" on the portfolio' });
  await toggle.click();

  await expect(page.getByText('Skills section hidden from the portfolio')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Show "Skills" on the portfolio' })).not.toBeChecked();
});
