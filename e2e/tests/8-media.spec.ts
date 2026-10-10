// Runs after the earlier specs: it relies on the profile they filled in and the "First App" project they created.
import { expect, test } from '@playwright/test';

import { logIn } from './helpers';

import type { Page } from '@playwright/test';

function fileCard(page: Page, fileName: string) {
  return page.getByRole('list', { name: 'Files' }).getByRole('link', { name: new RegExp(fileName.replace('.', '\\.')) });
}

test.beforeEach(async ({ page }) => {
  await logIn(page, undefined, '/media');
});

test('lists the library, filters it, and says uploads are not set up', async ({ page }) => {
  await expect(page.getByRole('status').filter({ hasText: 'Uploads are not set up yet' })).toBeVisible();
  await expect(fileCard(page, 'ocean.png')).toBeVisible();
  // The thumbnail must really load through the image optimizer, not just be present in the page.
  await expect
    .poll(() =>
      fileCard(page, 'ocean.png')
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  await expect(fileCard(page, 'forest.png')).toContainText('No alt text');
  await expect(fileCard(page, 'resume.pdf')).toBeVisible();

  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/kind=document/);
  await expect(fileCard(page, 'resume.pdf')).toBeVisible();
  await expect(fileCard(page, 'ocean.png')).toHaveCount(0);
});

test('shows a file’s details, saves its alt text and hides it', async ({ page }) => {
  await fileCard(page, 'ocean.png').click();
  const sheet = page.getByRole('dialog', { name: 'ocean.png' });
  await expect(sheet).toContainText('640 × 400 px');
  await expect(sheet).toContainText('Not used anywhere yet.');

  await sheet.getByRole('textbox', { name: 'Alt text' }).fill('A calm blue square');
  await sheet.getByRole('button', { name: 'Save alt text' }).click();
  await expect(page.getByText('Alt text saved')).toBeVisible();

  await sheet.getByRole('switch', { name: 'Show "ocean.png" on the portfolio' }).click();
  await expect(page.getByText('"ocean.png" hidden from the portfolio')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(fileCard(page, 'ocean.png')).toContainText('Hidden');
});

test('uses a file from the picker, shows where it is used, and deletes it from there after confirming', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('group', { name: 'Photo' }).getByRole('button', { name: 'Choose' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose an image' });
  await picker.getByRole('button', { name: /forest\.png/ }).click();
  await picker.getByRole('button', { name: 'Use this file' }).click();
  await expect(page.getByText('This image has no alt text yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();

  await page.goto('/media');
  await fileCard(page, 'forest.png').click();
  const sheet = page.getByRole('dialog', { name: 'forest.png' });
  await expect(sheet.getByRole('link', { name: /\(photo\)/ })).toHaveAttribute('href', '/profile');

  await sheet.getByRole('button', { name: 'Delete file' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Delete "forest.png"?' });
  await expect(confirm).toContainText('It is used in one place.');
  await expect(confirm.getByRole('list', { name: 'Used in' })).toContainText('(photo)');
  await confirm.getByRole('button', { name: 'Delete anyway' }).click();
  await expect(page.getByText('"forest.png" deleted and removed everywhere it was used')).toBeVisible();
  await expect(fileCard(page, 'forest.png')).toHaveCount(0);

  await page.goto('/profile');
  await expect(page.getByRole('group', { name: 'Photo' })).toContainText('No image chosen');
});

test('adds images to a project gallery', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('link', { name: 'Edit "First App"' }).click();
  await page.getByRole('button', { name: 'Add images' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose images' });
  await picker.getByRole('button', { name: /ocean\.png/ }).click();
  await picker.getByRole('button', { name: 'Add selected' }).click();
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Project "First App" saved')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('list', { name: 'Gallery images' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('list', { name: 'Gallery images' })).toContainText('ocean.png');
});
