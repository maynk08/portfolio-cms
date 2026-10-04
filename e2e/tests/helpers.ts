import { expect } from '@playwright/test';

import { e2eConfig } from '../e2e-config';

import type { Page } from '@playwright/test';

export const ADMIN = { email: e2eConfig.adminEmail, password: e2eConfig.adminPassword };

export async function logIn(page: Page, password = ADMIN.password, path = '/'): Promise<void> {
  await page.goto(path);
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Account menu for/ }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login\?reason=logged-out/);
}
