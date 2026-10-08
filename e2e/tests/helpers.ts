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
  // Clicks before React has hydrated the page are lost; wait until it has settled.
  await page.waitForLoadState('networkidle');
}

export async function logOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Account menu for/ }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login\?reason=logged-out/);
}

// Picks a month in a month picker whose label starts with `label` ("Started", "Issued").
export async function pickMonth(page: Page, label: string, year: number, monthName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${label}\\b`) }).click();
  const picker = page.getByRole('dialog');
  const shownYear = Number(await picker.locator('[aria-live="polite"]').textContent());
  const step = year < shownYear ? 'Previous year' : 'Next year';
  for (let count = 0; count < Math.abs(shownYear - year); count += 1) {
    await picker.getByRole('button', { name: step }).click();
  }
  await picker.getByRole('button', { name: `${monthName} ${year}` }).click();
  await expect(picker).toBeHidden();
}

// Opens the ⋮ menu of a row and confirms the delete dialog.
export async function deleteRow(page: Page, itemLabel: string): Promise<void> {
  await page.getByRole('button', { name: `More actions for "${itemLabel}"` }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(`"${itemLabel}"?`);
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(dialog).toBeHidden();
}
