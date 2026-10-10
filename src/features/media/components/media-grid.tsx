'use client';

import { EyeOffIcon, ImageOffIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { MediaThumbnail } from '@/features/media/components/media-thumbnail';
import { MEDIA_TYPES, isMediaMimeType, mediaKindOf } from '@/features/media/schemas';
import { formatFileSize } from '@/lib/utils/format-file-size';

import type { Media } from '@/features/media/schemas';

// Opens the details sheet through the URL (`?file=<id>`), keeping the current filter and page.
export function useFileHref(): (id: string | null) => string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (id) => {
    const params = new URLSearchParams(searchParams);
    if (id === null) {
      params.delete('file');
    } else {
      params.set('file', id);
    }
    const query = params.toString();
    return query === '' ? pathname : `${pathname}?${query}`;
  };
}

export function MediaGrid({ items }: { items: Media[] }) {
  const fileHref = useFileHref();

  return (
    <ul aria-label="Files" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((media) => {
        const isMissingAltText = mediaKindOf(media.mimeType) === 'image' && (media.altText ?? '') === '';
        return (
          <li key={media.id}>
            <Link
              href={fileHref(media.id)}
              scroll={false}
              className="flex flex-col gap-2 rounded-lg p-1 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MediaThumbnail media={media} sizes="(min-width: 1280px) 15vw, (min-width: 640px) 25vw, 45vw" />
              <span className="truncate text-sm font-medium">{media.fileName}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {isMediaMimeType(media.mimeType) ? MEDIA_TYPES[media.mimeType].label : media.mimeType} · {formatFileSize(media.size)}
              </span>
              {(!media.isVisible || isMissingAltText) && (
                <span className="flex flex-wrap gap-1">
                  {!media.isVisible && (
                    <Badge variant="outline">
                      <EyeOffIcon aria-hidden />
                      Hidden
                    </Badge>
                  )}
                  {isMissingAltText && (
                    <Badge variant="outline">
                      <ImageOffIcon aria-hidden />
                      No alt text
                    </Badge>
                  )}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
