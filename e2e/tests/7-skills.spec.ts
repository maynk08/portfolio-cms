import { expect, test } from '@playwright/test';

import { logIn } from './helpers';

test('creates a skill group, checking icon slugs and counting hidden skills', async ({ page }) => {
  await logIn(page, undefined, '/skills/new');

  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Backend');
  // Two quick clicks: the second used to be lost when the first new entry's blur error pushed the button down.
  await page.getByRole('button', { name: 'Add skill' }).click();
  await page.getByRole('button', { name: 'Add skill' }).click();
  const first = page.getByRole('listitem', { name: 'Skill 1' });
  const second = page.getByRole('listitem', { name: 'Skill 2' });
  await first.getByRole('textbox', { name: 'Name', exact: true }).fill('Node.js');
  await first.getByRole('textbox', { name: 'Icon slug', exact: true }).fill('Node.js');
  await second.getByRole('textbox', { name: 'Name', exact: true }).fill('SQL');
  await second.getByRole('switch', { name: 'Show skill 2' }).click();

  await page.getByRole('button', { name: 'Create skill group' }).click();
  await expect(first.getByText('Use the Simple Icons slug: lowercase letters and numbers, like nodedotjs')).toBeVisible();

  await first.getByRole('textbox', { name: 'Icon slug', exact: true }).fill('nodedotjs');
  await page.getByRole('button', { name: 'Create skill group' }).click();

  await expect(page).toHaveURL(/\/skills$/);
  await expect(page.getByRole('row', { name: /Backend/ })).toContainText('2 skills (1 hidden)');
});
