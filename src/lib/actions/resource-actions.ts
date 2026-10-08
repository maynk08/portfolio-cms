import 'server-only';

import { z } from 'zod';

import { runAction, toValidationFailure } from '@/lib/actions/action-result';
import { apiRequest } from '@/lib/api/api-client';
import { objectIdSchema } from '@/lib/validation/common-schemas';

import type { ActionResult } from '@/lib/actions/action-result';

// The plumbing shared by every list-type resource (experience, projects, …); each feature's actions call these.

const NOT_FOUND: ActionResult<never> = { ok: false, formError: 'This item no longer exists. Go back to the list and try again.' };
const savedItemSchema = z.object({ id: z.string() });
const labelSchema = z.string().trim().min(1).max(300);
const MAX_ORDERED_IDS = 500;

interface SaveOptions<T> {
  // Admin API path of the list, e.g. `/projects`.
  path: string;
  // Present when editing; checked before it goes into the URL.
  id?: unknown;
  schema: z.ZodType<T>;
  values: unknown;
  // Names the item for the toast: `Project "Portfolio CMS"`.
  describe: (input: T) => string;
}

// Creates (POST) or updates (PATCH) an item from raw form values, validated here with the form's own schema.
export async function saveResource<T>({ path, id, schema, values, describe }: SaveOptions<T>): Promise<ActionResult<{ id: string }>> {
  const itemId = id === undefined ? null : objectIdSchema.safeParse(id);
  if (itemId !== null && !itemId.success) {
    return NOT_FOUND;
  }
  const input = schema.safeParse(values);
  if (!input.success) {
    return toValidationFailure(input.error);
  }
  const isUpdate = itemId !== null;
  return runAction(
    () =>
      apiRequest(isUpdate ? `${path}/${itemId.data}` : path, {
        method: isUpdate ? 'PATCH' : 'POST',
        body: input.data,
        schema: savedItemSchema,
      }),
    `${describe(input.data)} ${isUpdate ? 'saved' : 'created'}`,
  );
}

export async function deleteResource(path: string, id: unknown, label: unknown): Promise<ActionResult> {
  const itemId = objectIdSchema.safeParse(id);
  const itemLabel = labelSchema.safeParse(label);
  if (!itemId.success || !itemLabel.success) {
    return NOT_FOUND;
  }
  return runAction(async () => {
    await apiRequest(`${path}/${itemId.data}`, { method: 'DELETE', schema: z.null() });
    return null;
  }, `${itemLabel.data} deleted`);
}

// Saves on/off switches from the list (shown on the portfolio, featured), with the message to show.
export async function setResourceFlag(
  path: string,
  id: unknown,
  flag: 'isVisible' | 'isFeatured',
  value: unknown,
  message: string,
): Promise<ActionResult> {
  const itemId = objectIdSchema.safeParse(id);
  const flagValue = z.boolean().safeParse(value);
  if (!itemId.success || !flagValue.success) {
    return NOT_FOUND;
  }
  return runAction(async () => {
    await apiRequest(`${path}/${itemId.data}`, { method: 'PATCH', body: { [flag]: flagValue.data }, schema: savedItemSchema });
    return null;
  }, message);
}

// Saves a new manual order; `ids` must list every item once (the backend checks this too).
export async function reorderResources(path: string, ids: unknown): Promise<ActionResult> {
  const orderedIds = z.array(objectIdSchema).min(1).max(MAX_ORDERED_IDS).safeParse(ids);
  if (!orderedIds.success) {
    return { ok: false, formError: 'The order could not be saved. Reload the page and try again.' };
  }
  return runAction(async () => {
    await apiRequest(`${path}/order`, { method: 'PATCH', body: { ids: orderedIds.data }, schema: z.null() });
    return null;
  }, 'Order saved');
}

// A short, safe label for messages built on the server from a value the browser sent.
export function quoteLabel(label: unknown): string {
  const parsed = labelSchema.safeParse(label);
  return parsed.success ? `"${parsed.data}"` : 'The item';
}
