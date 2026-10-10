'use client';

import { EyeOffIcon, ImageOffIcon } from 'lucide-react';
import { useState, useTransition } from 'react';

import { notifyError } from '@/components/feedback/notify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadPickerPage } from '@/features/media/actions';
import { MediaThumbnail } from '@/features/media/components/media-thumbnail';
import { UploadPanel } from '@/features/media/components/upload-panel';
import { GENERIC_ERROR_MESSAGE } from '@/lib/actions/action-result';
import { cn } from '@/lib/utils/cn';

import type { Media, MediaKind } from '@/features/media/schemas';
import type { ActionResult } from '@/lib/actions/action-result';
import type { ApiPage } from '@/lib/api/api-client';

export type PickerPageResult = ActionResult<{ page: ApiPage<Media>; isUploadConfigured: boolean }>;

// Loads the picker's first page; the button that opens the picker awaits it, so loading starts on the click.
export function loadFirstPickerPage(kind: MediaKind): Promise<PickerPageResult> {
  return loadPickerPage(kind, 1);
}

type MediaPickerDialogProps = {
  kind: MediaKind;
  isMultiple: boolean;
  firstPage: PickerPageResult;
  onSelect: (media: Media[]) => void;
  onClose: () => void;
};

// Choose from the library (only files of the right kind) or upload a new one, without leaving the form.
export function MediaPickerDialog({ kind, isMultiple, firstPage, onSelect, onClose }: MediaPickerDialogProps) {
  const [selected, setSelected] = useState<Media[]>([]);
  const noun = kind === 'image' ? (isMultiple ? 'images' : 'an image') : 'a PDF';

  const toggle = (media: Media): void => {
    setSelected((current) => {
      if (current.some((item) => item.id === media.id)) {
        return current.filter((item) => item.id !== media.id);
      }
      return isMultiple ? [...current, media] : [media];
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose {noun}</DialogTitle>
          <DialogDescription>Pick from the media library, or upload a new file.</DialogDescription>
        </DialogHeader>
        <PickerBody kind={kind} first={firstPage} selected={selected} onToggle={toggle} />
        <DialogFooter>
          <span className="mr-auto self-center text-sm text-muted-foreground" aria-live="polite">
            {selected.length === 0 ? 'Nothing selected' : selected.length === 1 ? '1 selected' : `${selected.length} selected`}
          </span>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              onSelect(selected);
            }}
          >
            {isMultiple ? 'Add selected' : 'Use this file'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PickerBodyProps = {
  kind: MediaKind;
  first: PickerPageResult;
  selected: Media[];
  onToggle: (media: Media) => void;
};

function PickerBody({ kind, first, selected, onToggle }: PickerBodyProps) {
  const [morePages, setMorePages] = useState<ApiPage<Media>[]>([]);
  const [uploaded, setUploaded] = useState<Media[]>([]);
  const [tab, setTab] = useState('library');
  const [isLoadingMore, startLoadingMore] = useTransition();

  if (!first.ok) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {first.formError ?? GENERIC_ERROR_MESSAGE}
      </p>
    );
  }

  const lastPage = morePages.at(-1) ?? first.data.page;
  const hasMore = lastPage.pagination.page < lastPage.pagination.totalPages;
  const uploadedIds = new Set(uploaded.map((media) => media.id));
  const items = [
    ...uploaded,
    ...[first.data.page, ...morePages].flatMap((page) => page.items).filter((media) => !uploadedIds.has(media.id)),
  ];

  const loadMore = (): void => {
    startLoadingMore(async () => {
      const next = await loadPickerPage(kind, lastPage.pagination.page + 1);
      if (next.ok) {
        setMorePages((current) => [...current, next.data.page]);
      } else {
        notifyError(next.formError ?? GENERIC_ERROR_MESSAGE);
      }
    });
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
      <TabsList>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
      </TabsList>
      <TabsContent value="library" className="min-h-0 overflow-y-auto">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {kind === 'image' ? 'images' : 'PDFs'} in the library yet. Upload one in the Upload tab.
          </p>
        ) : (
          <ul aria-label="Library" className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-4">
            {items.map((media) => {
              const isSelected = selected.some((item) => item.id === media.id);
              const isMissingAltText = kind === 'image' && (media.altText ?? '') === '';
              return (
                <li key={media.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onToggle(media);
                    }}
                    className={cn(
                      'flex w-full flex-col gap-1.5 rounded-lg border-2 border-transparent p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected && 'border-primary',
                    )}
                  >
                    <MediaThumbnail media={media} sizes="(min-width: 640px) 10rem, 45vw" />
                    <span className="truncate text-sm">{media.fileName}</span>
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
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {hasMore && (
          <div className="flex justify-center pt-3">
            <Button type="button" variant="outline" disabled={isLoadingMore} onClick={loadMore}>
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </TabsContent>
      <TabsContent value="upload">
        <UploadPanel
          isConfigured={first.data.isUploadConfigured}
          kind={kind}
          onUploaded={(media) => {
            // A fresh upload goes to the top of the library, already selected.
            setUploaded((current) => [media, ...current]);
            if (!selected.some((item) => item.id === media.id)) {
              onToggle(media);
            }
            setTab('library');
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
