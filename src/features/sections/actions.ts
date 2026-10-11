'use server';

import { z } from 'zod';

import { runAction, toValidationFailure } from '@/lib/actions/action-result';
import { apiRequest } from '@/lib/api/api-client';

import { SECTION_DETAILS, SECTION_KEYS, renameSectionSchema, sectionKeySchema, sectionSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

const UNKNOWN_SECTION: ActionResult = { ok: false, formError: 'This section does not exist.' };

export async function renameSection(key: unknown, values: unknown): Promise<ActionResult> {
  const sectionKey = sectionKeySchema.safeParse(key);
  if (!sectionKey.success) {
    return UNKNOWN_SECTION;
  }
  const input = renameSectionSchema.safeParse(values);
  if (!input.success) {
    return toValidationFailure(input.error);
  }
  return runAction(async () => {
    await apiRequest(`/sections/${sectionKey.data}`, { method: 'PATCH', body: input.data, schema: sectionSchema });
    return null;
  }, `${SECTION_DETAILS[sectionKey.data].name} section renamed to "${input.data.heading}"`);
}

export async function setSectionVisibility(key: unknown, isVisible: unknown): Promise<ActionResult> {
  const sectionKey = sectionKeySchema.safeParse(key);
  const visibility = z.boolean().safeParse(isVisible);
  if (!sectionKey.success || !visibility.success) {
    return UNKNOWN_SECTION;
  }
  return runAction(
    async () => {
      await apiRequest(`/sections/${sectionKey.data}`, { method: 'PATCH', body: { isVisible: visibility.data }, schema: sectionSchema });
      return null;
    },
    `${SECTION_DETAILS[sectionKey.data].name} section ${visibility.data ? 'shown on' : 'hidden from'} the portfolio`,
  );
}

// Saves the display order of all sections; the backend also checks that every section is listed once and the hero is first.
export async function reorderSections(keys: unknown): Promise<ActionResult> {
  const orderedKeys = z.array(sectionKeySchema).length(SECTION_KEYS.length).safeParse(keys);
  if (!orderedKeys.success) {
    return { ok: false, formError: 'The order could not be saved. Reload the page and try again.' };
  }
  return runAction(async () => {
    await apiRequest('/sections/order', { method: 'PATCH', body: { keys: orderedKeys.data }, schema: z.null() });
    return null;
  }, 'Order saved');
}
