'use server';

import { z } from 'zod';

import { runAction, toActionFailure, toValidationFailure } from '@/lib/actions/action-result';
import { deleteResource, quoteLabel, setResourceFlag } from '@/lib/actions/resource-actions';
import { apiRequest, apiRequestPage } from '@/lib/api/api-client';
import { ApiUnavailableError } from '@/lib/api/api-errors';
import { objectIdSchema } from '@/lib/validation/common-schemas';

import { MEDIA_PATH, UPLOADS_NOT_SET_UP_MESSAGE, altTextFormSchema, mediaSchema, uploadRequestSchema, uploadTicketSchema } from './schemas';

import type { Media } from './schemas';
import type { ActionResult } from '@/lib/actions/action-result';
import type { ApiPage } from '@/lib/api/api-client';

const PICKER_PAGE_SIZE = 24;

const NO_FILE: ActionResult<never> = { ok: false, formError: 'This file no longer exists.' };

// Step 1 of an upload: the backend records the file and returns a short-lived form for posting it straight to storage.
export async function requestUpload(
  input: unknown,
): Promise<ActionResult<{ mediaId: string; url: string; fields: Record<string, string> }>> {
  const request = uploadRequestSchema.safeParse(input);
  if (!request.success) {
    return toValidationFailure(request.error);
  }
  try {
    const ticket = await apiRequest(`${MEDIA_PATH}/upload-url`, { method: 'POST', body: request.data, schema: uploadTicketSchema });
    return { ok: true, message: 'Upload ready', data: { mediaId: ticket.media.id, url: ticket.upload.url, fields: ticket.upload.fields } };
  } catch (error) {
    if (error instanceof ApiUnavailableError && error.isReportedByBackend) {
      return { ok: false, formError: UPLOADS_NOT_SET_UP_MESSAGE };
    }
    return toActionFailure(error);
  }
}

// Step 3: the backend checks the file arrived as announced and makes it usable.
export async function completeUpload(id: unknown): Promise<ActionResult<Media>> {
  const mediaId = objectIdSchema.safeParse(id);
  if (!mediaId.success) {
    return NO_FILE;
  }
  return runAction(
    () => apiRequest(`${MEDIA_PATH}/${mediaId.data}/complete`, { method: 'POST', schema: mediaSchema }),
    (media) => `"${media.fileName}" uploaded`,
  );
}

export async function saveAltText(id: unknown, values: unknown): Promise<ActionResult> {
  const mediaId = objectIdSchema.safeParse(id);
  if (!mediaId.success) {
    return NO_FILE;
  }
  const input = altTextFormSchema.safeParse(values);
  if (!input.success) {
    return toValidationFailure(input.error);
  }
  return runAction(async () => {
    await apiRequest(`${MEDIA_PATH}/${mediaId.data}`, { method: 'PATCH', body: input.data, schema: mediaSchema });
    return null;
  }, 'Alt text saved');
}

export async function setMediaVisibility(id: unknown, isVisible: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    MEDIA_PATH,
    id,
    'isVisible',
    isVisible,
    `${quoteLabel(label)} ${isVisible === true ? 'shown on' : 'hidden from'} the portfolio`,
  );
}

/**
 * Deletes a file from the library and from storage. `force` is set only after the admin saw where the file is used
 * and confirmed; it is then removed from those places too.
 */
export async function deleteMedia(id: unknown, label: unknown, force: unknown): Promise<ActionResult> {
  const mediaId = objectIdSchema.safeParse(id);
  const isForced = z.boolean().safeParse(force);
  if (!mediaId.success || !isForced.success) {
    return NO_FILE;
  }
  if (!isForced.data) {
    return deleteResource(MEDIA_PATH, mediaId.data, quoteLabel(label));
  }
  return runAction(
    async () => {
      await apiRequest(`${MEDIA_PATH}/${mediaId.data}`, { method: 'DELETE', query: { force: 'true' }, schema: z.null() });
      return null;
    },
    `${quoteLabel(label)} deleted and removed everywhere it was used`,
  );
}

// One page of the library for the media picker (a dialog, so it loads on demand instead of with the page),
// with whether uploads are set up, for the picker's Upload tab.
export async function loadPickerPage(
  kind: unknown,
  page: unknown,
): Promise<ActionResult<{ page: ApiPage<Media>; isUploadConfigured: boolean }>> {
  const mediaKind = z.enum(['image', 'document']).safeParse(kind);
  const pageNumber = z.number().int().min(1).safeParse(page);
  if (!mediaKind.success || !pageNumber.success) {
    return { ok: false, formError: 'The library could not be loaded.' };
  }
  try {
    const [result, status] = await Promise.all([
      apiRequestPage(MEDIA_PATH, {
        itemSchema: mediaSchema,
        query: { kind: mediaKind.data, page: pageNumber.data, pageSize: PICKER_PAGE_SIZE },
      }),
      apiRequest(`${MEDIA_PATH}/upload-status`, { schema: z.object({ isConfigured: z.boolean() }) }),
    ]);
    return { ok: true, message: '', data: { page: result, isUploadConfigured: status.isConfigured } };
  } catch (error) {
    return toActionFailure(error);
  }
}
