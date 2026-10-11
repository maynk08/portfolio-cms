import { expect, test } from '@playwright/test';

import { deleteRow, logIn } from './helpers';

import type { Page } from '@playwright/test';

async function createProject(page: Page, title: string): Promise<void> {
  await page.goto('/projects/new');
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByText(`Project "${title}" created`)).toBeVisible();
}

async function projectTitles(page: Page): Promise<string[]> {
  // Cells: drag handle, position, project.
  return page.getByRole('row').locator('td:nth-child(3) .font-medium').allTextContents();
}

test.beforeEach(async ({ page }) => {
  await logIn(page, undefined, '/projects');
});

test('creates projects with slugs from their titles, and keeps a new order', async ({ page }) => {
  await createProject(page, 'First App');
  await createProject(page, 'Second App');
  await createProject(page, 'Third App');

  await expect(page.getByText('/projects/first-app')).toBeVisible();
  await expect.poll(() => projectTitles(page)).toEqual(['First App', 'Second App', 'Third App']);

  await page.getByRole('button', { name: 'Move down "First App"' }).click();
  await expect.poll(() => projectTitles(page)).toEqual(['Second App', 'First App', 'Third App']);
  await page.reload();
  await expect.poll(() => projectTitles(page)).toEqual(['Second App', 'First App', 'Third App']);

  // Drag "Third App" by its handle onto the first row.
  const handle = page.getByRole('button', { name: 'Reorder "Third App"' });
  const target = page.getByRole('button', { name: 'Reorder "Second App"' });
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (from === null || to === null) {
    throw new Error('The drag handles are not on screen');
  }
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 - 4, { steps: 12 });
  await page.mouse.up();

  await expect.poll(() => projectTitles(page)).toEqual(['Third App', 'Second App', 'First App']);
  // No success message: the row moving is the confirmation. The reload proves it was saved.
  await page.reload();
  await expect.poll(() => projectTitles(page)).toEqual(['Third App', 'Second App', 'First App']);
});

test('features a project from the list', async ({ page }) => {
  await page.getByRole('switch', { name: 'Feature "Third App" on the home page' }).click();
  await expect(page.getByText('Project "Third App" featured on the home page')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('switch', { name: 'Feature "Third App" on the home page' })).toBeChecked();
});

test('checks the slug when editing, then deletes', async ({ page }) => {
  await page.getByRole('link', { name: 'Edit "Second App"' }).click();
  await page.getByLabel(/^Slug/).fill('Not A Slug');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Use lowercase letters, numbers and single hyphens, like my-project')).toBeVisible();

  await page.getByLabel(/^Slug/).fill('second');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Project "Second App" saved')).toBeVisible();

  await page.getByRole('link', { name: 'Projects', exact: true }).last().click();
  await expect(page.getByText('/projects/second', { exact: true })).toBeVisible();
  await deleteRow(page, 'Second App');
  await expect(page.getByText('Project "Second App" deleted')).toBeVisible();
  await expect.poll(() => projectTitles(page)).toEqual(['Third App', 'First App']);
});
