import { completeUpload, requestUpload } from '@/features/media/actions';
import { MEDIA_TYPES, MEGABYTE, isMediaMimeType } from '@/features/media/schemas';
import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';

import type { Media, MediaKind } from '@/features/media/schemas';
import type { ActionResult } from '@/lib/actions/action-result';

const STORAGE_ERROR_MESSAGE = 'The file could not be sent to storage. Check your connection and try again.';

// Checked in the browser before anything is sent; the backend checks the same rules again.
export function checkFile(file: File, kind?: MediaKind): string | null {
  if (!isMediaMimeType(file.type)) {
    return kind === 'document' ? 'Choose a PDF file.' : 'Choose a JPEG, PNG, WebP, AVIF or GIF image, or a PDF. SVG files are not allowed.';
  }
  const rule = MEDIA_TYPES[file.type];
  if (kind !== undefined && rule.kind !== kind) {
    return kind === 'image' ? 'Choose an image (JPEG, PNG, WebP, AVIF or GIF).' : 'Choose a PDF file.';
  }
  if (file.size === 0) {
    return 'This file is empty.';
  }
  if (file.size > rule.maxBytes) {
    return `This file is too large: ${rule.label} files can be at most ${rule.maxBytes / MEGABYTE} MB.`;
  }
  return null;
}

// Width and height for the portfolio's image layout; null when the browser cannot read them.
async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') {
    return null;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    // An image the browser cannot decode still uploads; it just has no recorded size.
    return null;
  }
}

// Posts the file straight to storage with the pre-signed form, reporting progress from 0 to 1.
export function postToStorage(
  url: string,
  fields: Record<string, string>,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    for (const [name, value] of Object.entries(fields)) {
      body.append(name, value);
    }
    // The file must be the last field of a pre-signed POST.
    body.append('file', file);

    const request = new XMLHttpRequest();
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`Storage answered ${request.status}`));
      }
    });
    request.addEventListener('error', () => {
      reject(new Error('Network error while uploading'));
    });
    request.open('POST', url);
    request.send(body);
  });
}

/**
 * Uploads one file in three steps: the backend records it and returns a pre-signed form, the browser sends the file
 * straight to storage, and the backend confirms it arrived. A file that never arrives is cleaned up by the backend.
 */
export async function uploadFile(
  file: File,
  options: { altText: string; kind?: MediaKind; onProgress: (fraction: number) => void },
): Promise<ActionResult<Media>> {
  const problem = checkFile(file, options.kind);
  if (problem !== null) {
    return { ok: false, formError: problem };
  }

  const size = await readImageSize(file);
  const ticket = await requestUpload({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    width: size?.width ?? null,
    height: size?.height ?? null,
    altText: options.altText,
  });
  if (!ticket.ok) {
    return { ok: false, formError: ticket.formError ?? Object.values(ticket.fieldErrors ?? {})[0] ?? GENERIC_ERROR_MESSAGE };
  }

  try {
    await postToStorage(ticket.data.url, ticket.data.fields, file, options.onProgress);
  } catch {
    return { ok: false, formError: STORAGE_ERROR_MESSAGE };
  }
  return completeUpload(ticket.data.mediaId);
}
