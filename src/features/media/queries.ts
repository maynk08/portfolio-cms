import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import { apiRequest } from '@/lib/api/api-client';
import { ApiNotFoundError } from '@/lib/api/api-errors';
import { getResourceOrNotFound, getResourcePage } from '@/lib/api/resource-queries';
import { OBJECT_ID_PATTERN } from '@/lib/validation/common-schemas';

import { MEDIA_PATH, mediaSchema, mediaUsageSchema } from './schemas';

import type { Media, MediaKind, MediaUsage } from './schemas';
import type { ApiPage } from '@/lib/api/api-client';
import type { ListParams } from '@/lib/utils/list-params';

export function getMediaPage(
  kind: MediaKind | undefined,
  list: { params: ListParams; pathname: string; searchParams: Record<string, string | string[] | undefined> },
): Promise<ApiPage<Media>> {
  return getResourcePage(MEDIA_PATH, mediaSchema, list, { kind });
}

export const getMedia = cache((id: string): Promise<Media> => getResourceOrNotFound(MEDIA_PATH, id, mediaSchema));

export function getMediaUsages(id: string): Promise<MediaUsage[]> {
  return apiRequest(`${MEDIA_PATH}/${id}/usages`, { schema: z.array(mediaUsageSchema) });
}

// Whether the backend has file storage set up, so the upload area can say so before anyone tries.
export async function getUploadStatus(): Promise<{ isConfigured: boolean }> {
  return apiRequest(`${MEDIA_PATH}/upload-status`, { schema: z.object({ isConfigured: z.boolean() }) });
}

// The files a form refers to, loaded in parallel; a file deleted in the meantime is simply left out.
export async function getMediaByIds(ids: (string | null | undefined)[]): Promise<Record<string, Media>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => typeof id === 'string' && OBJECT_ID_PATTERN.test(id)))];
  const found = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        return await apiRequest(`${MEDIA_PATH}/${id}`, { schema: mediaSchema });
      } catch (error) {
        if (error instanceof ApiNotFoundError) {
          return null;
        }
        throw error;
      }
    }),
  );
  return Object.fromEntries(found.filter((media): media is Media => media !== null).map((media) => [media.id, media]));
}
