import { expect, test } from '@playwright/test';

import { ADMIN, logIn, logOut } from './helpers';

test('sends visitors without a session to the login page, and back after logging in', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);

  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill('not-the-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Email or password is incorrect.' })).toBeVisible();

  await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
});

test('logs out and shows a notice', async ({ page }) => {
  await logIn(page);
  await logOut(page);

  await expect(page.getByRole('status')).toHaveText('You have been logged out.');
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
