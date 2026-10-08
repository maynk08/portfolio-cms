import { expect, test } from '@playwright/test';

import { logIn, pickMonth } from './helpers';

test('adds an ongoing degree', async ({ page }) => {
  await logIn(page, undefined, '/education/new');

  await page.getByRole('textbox', { name: 'Degree', exact: true }).fill('MSc');
  await page.getByRole('textbox', { name: 'School or university', exact: true }).fill('Open University');
  await pickMonth(page, 'Started', 2025, 'September');
  await page.getByRole('checkbox', { name: 'Still studying' }).check();
  await page.getByRole('button', { name: 'Create education' }).click();

  await expect(page).toHaveURL(/\/education$/);
  await expect(page.getByRole('row', { name: /MSc/ })).toContainText('Sep 2025 – Present');
});

test('marks an expired certificate', async ({ page }) => {
  await logIn(page, undefined, '/certifications/new');

  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Old Cert');
  await page.getByRole('textbox', { name: 'Issued by', exact: true }).fill('Acme Academy');
  await pickMonth(page, 'Issued', 2020, 'January');
  await pickMonth(page, 'Expires', 2023, 'January');
  await page.getByRole('button', { name: 'Create certification' }).click();

  await expect(page).toHaveURL(/\/certifications$/);
  await expect(page.getByRole('row', { name: /Old Cert/ })).toContainText('Expired');
});
