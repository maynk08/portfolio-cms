'use client';

import { CopyIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { InstantSwitch } from '@/components/data-table/instant-switch';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { notifyError, notifySuccess } from '@/components/feedback/notify';
import { Timestamp } from '@/components/feedback/timestamp';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { deleteMedia, setMediaVisibility } from '@/features/media/actions';
import { AltTextForm } from '@/features/media/components/alt-text-form';
import { useFileHref } from '@/features/media/components/media-grid';
import { MediaThumbnail } from '@/features/media/components/media-thumbnail';
import { MEDIA_TYPES, describeUsage, isMediaMimeType, mediaKindOf } from '@/features/media/schemas';
import { formatFileSize } from '@/lib/utils/format-file-size';

import type { Media, MediaUsage } from '@/features/media/schemas';

type MediaDetailsSheetProps = {
  media: Media;
  usages: MediaUsage[];
};

// Everything about one file: preview, facts, alt text, show/hide, where it is used, and delete.
export function MediaDetailsSheet({ media, usages }: MediaDetailsSheetProps) {
  const router = useRouter();
  const fileHref = useFileHref();
  const hasUnsavedChangesRef = useRef(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isImage = mediaKindOf(media.mimeType) === 'image';
  const isInUse = usages.length > 0;
  const closeHref = fileHref(null);

  const close = (): void => {
    router.push(closeHref, { scroll: false });
  };

  const copyUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(media.url);
      notifySuccess('Address copied');
    } catch {
      notifyError('The address could not be copied. Select it and copy it by hand.');
    }
  };

  return (
    <>
      <Sheet
        open
        onOpenChange={(open) => {
          if (open) {
            return;
          }
          if (hasUnsavedChangesRef.current) {
            setIsConfirmingClose(true);
          } else {
            close();
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="break-all">{media.fileName}</SheetTitle>
            <SheetDescription>
              {isMediaMimeType(media.mimeType) ? MEDIA_TYPES[media.mimeType].label : media.mimeType} · {formatFileSize(media.size)}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-4 pb-6">
            {isImage && media.width !== null && media.width !== undefined && media.height !== null && media.height !== undefined ? (
              <Image
                src={media.url}
                alt={media.altText ?? ''}
                width={media.width}
                height={media.height}
                sizes="(min-width: 640px) 26rem, 90vw"
                className="h-auto max-h-80 w-full rounded-md bg-muted object-contain"
              />
            ) : (
              <MediaThumbnail media={media} sizes="(min-width: 640px) 26rem, 90vw" />
            )}

            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
              {isImage && media.width !== null && media.width !== undefined && (
                <>
                  <dt className="text-muted-foreground">Dimensions</dt>
                  <dd className="tabular-nums">
                    {media.width} × {media.height} px
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd>
                <Timestamp value={media.createdAt} />
              </dd>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="flex min-w-0 items-center gap-1">
                <span className="truncate font-mono text-xs">{media.url}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Copy the file’s address" onClick={() => void copyUrl()}>
                  <CopyIcon aria-hidden />
                </Button>
              </dd>
            </dl>

            {!isImage && (
              <Button variant="outline" asChild>
                <a href={media.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon aria-hidden />
                  Open PDF
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            )}

            {isImage && (
              <AltTextForm key={media.id} mediaId={media.id} altText={media.altText ?? ''} hasUnsavedChangesRef={hasUnsavedChangesRef} />
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Show on the portfolio</span>
                <span className="text-sm text-muted-foreground">Hidden files are left out wherever they are used.</span>
              </div>
              <InstantSwitch
                checked={media.isVisible}
                label={`Show "${media.fileName}" on the portfolio`}
                onChange={(isVisible) => setMediaVisibility(media.id, isVisible, media.fileName)}
              />
            </div>

            <section aria-labelledby="where-used" className="flex flex-col gap-2">
              <h3 id="where-used" className="text-sm font-medium">
                Where used
              </h3>
              {isInUse ? (
                <ul className="flex flex-col gap-1 text-sm">
                  {usages.map((usage) => {
                    const { href, text } = describeUsage(usage);
                    return (
                      <li key={`${usage.resource}-${usage.id}-${usage.field}`}>
                        <GuardedLink href={href} className="underline underline-offset-4">
                          {text}
                        </GuardedLink>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Not used anywhere yet.</p>
              )}
            </section>

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setIsConfirmingDelete(true);
                }}
              >
                <Trash2Icon aria-hidden />
                Delete file
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={`Delete "${media.fileName}"?`}
        description={
          isInUse
            ? `It is used in ${usages.length === 1 ? 'one place' : `${usages.length} places`}. Deleting it also removes it from there. This cannot be undone.`
            : 'It will be removed from the library and from storage. This cannot be undone.'
        }
        confirmLabel={isInUse ? 'Delete anyway' : 'Delete'}
        pendingLabel="Deleting…"
        onConfirm={() => deleteMedia(media.id, media.fileName, isInUse)}
        onSuccess={close}
      >
        {isInUse && (
          <ul aria-label="Used in" className="list-disc pl-5 text-sm">
            {usages.map((usage) => (
              <li key={`${usage.resource}-${usage.id}-${usage.field}`}>{describeUsage(usage).text}</li>
            ))}
          </ul>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={isConfirmingClose}
        onOpenChange={setIsConfirmingClose}
        title="Discard unsaved changes?"
        description="The alt text you changed has not been saved."
        confirmLabel="Discard changes"
        onConfirm={() => Promise.resolve(undefined)}
        onSuccess={close}
      />
    </>
  );
}
