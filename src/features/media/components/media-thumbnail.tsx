import { FileTextIcon } from 'lucide-react';
import Image from 'next/image';

import { mediaKindOf } from '@/features/media/schemas';
import { cn } from '@/lib/utils/cn';

import type { Media } from '@/features/media/schemas';

type MediaThumbnailProps = {
  media: Pick<Media, 'url' | 'mimeType' | 'altText' | 'fileName'>;
  // The rendered width, for picking the right image size: "(min-width: 768px) 200px, 50vw".
  sizes: string;
  className?: string;
};

// A square preview: the image itself, or a document icon for PDFs.
export function MediaThumbnail({ media, sizes, className }: MediaThumbnailProps) {
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-md bg-muted', className)}>
      {mediaKindOf(media.mimeType) === 'image' ? (
        // Decorative here: the file name is always shown next to the thumbnail.
        <Image src={media.url} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <FileTextIcon aria-hidden className="size-8" />
          <span className="text-xs font-medium">PDF</span>
        </div>
      )}
    </div>
  );
}
