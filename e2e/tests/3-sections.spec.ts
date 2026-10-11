import { expect, test } from '@playwright/test';

import { logIn } from './helpers';

import type { Page } from '@playwright/test';

async function sectionNames(page: Page): Promise<string[]> {
  // Cells: drag handle, position, heading.
  return page.getByRole('row').locator('td:nth-child(3)').allTextContents();
}

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

test('reorders sections with the keyboard, keeping the hero first', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Reorder "Home"' })).toHaveCount(0);
  const before = await sectionNames(page);
  expect(before[0]).toBe('Home');
  const projectsIndex = before.indexOf('Projects');

  // Each key waits for the spoken update, as a screen reader user would hear it.
  const total = before.length;
  await page.getByRole('button', { name: 'Reorder "Projects"' }).focus();
  await page.keyboard.press('Space');
  // "Picked up …" is followed at once by where the row is now, so either may be the latest update.
  await expect(
    page.getByText(new RegExp(`^(Picked up Projects\\. Position|Projects is at position) ${projectsIndex + 1} of ${total}\\.$`)),
  ).toBeAttached();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByText(`Projects is at position ${projectsIndex} of ${total}.`)).toBeAttached();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByText(`Projects is at position ${projectsIndex - 1} of ${total}.`)).toBeAttached();
  await page.keyboard.press('Space');
  await expect(page.getByText(`Projects moved to position ${projectsIndex - 1} of ${total}.`)).toBeAttached();

  const expected = [...before];
  expected.splice(projectsIndex, 1);
  expected.splice(projectsIndex - 2, 0, 'Projects');
  await expect.poll(() => sectionNames(page)).toEqual(expected);
  await page.reload();
  await expect.poll(() => sectionNames(page)).toEqual(expected);
});
