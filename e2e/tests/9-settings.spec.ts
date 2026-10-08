import { expect, test } from '@playwright/test';

import { ADMIN, logIn, logOut } from './helpers';

const NEW_PASSWORD = 'e2e-only-password-0002';

test('changes the portfolio theme', async ({ page }) => {
  await logIn(page, undefined, '/settings');

  await page.getByRole('radio', { name: 'Light' }).click();
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Portfolio theme set to light')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
});

// Runs last: it changes the password the other tests log in with.
test('changes the password, stays logged in, and the new password works', async ({ page }) => {
  await logIn(page, undefined, '/settings');

  await page.getByLabel(/^Current password/).fill('wrong-current-password');
  await page.getByLabel(/^New password/).fill(NEW_PASSWORD);
  await page.getByLabel(/^Confirm new password/).fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Current password is incorrect')).toBeVisible();

  await page.getByLabel(/^Current password/).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Password changed. Any other sessions have been logged out.')).toBeVisible();
  await expect(page.getByLabel(/^Current password/)).toHaveValue('');

  await page.reload();
  await expect(page).toHaveURL(/\/settings$/);

  await logOut(page);
  await logIn(page, NEW_PASSWORD);
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
});
