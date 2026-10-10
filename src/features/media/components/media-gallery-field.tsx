'use client';

import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldError } from '@/components/ui/field';
import { MediaPickerDialog, loadFirstPickerPage } from '@/features/media/components/media-picker-dialog';
import { MediaThumbnail } from '@/features/media/components/media-thumbnail';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { PickerPageResult } from '@/features/media/components/media-picker-dialog';
import type { Media } from '@/features/media/schemas';
import type { FieldValues } from 'react-hook-form';

type MediaGalleryFieldProps<T extends FieldValues, TTransformed extends FieldValues> = Omit<
  FormFieldProps<T, TTransformed>,
  'isRequired'
> & {
  maxItems: number;
  knownMedia: Record<string, Media>;
};

// An ordered set of images (a project's gallery): add several from the library, reorder, remove.
export function MediaGalleryField<T extends FieldValues, TTransformed extends FieldValues>({
  control,
  name,
  label,
  description,
  maxItems,
  knownMedia,
}: MediaGalleryFieldProps<T, TTransformed>) {
  const {
    field: { ref, value: fieldValue, onChange },
    fieldState,
  } = useController({ control, name });
  const [picked, setPicked] = useState<Record<string, Media>>({});
  const [firstPage, setFirstPage] = useState<PickerPageResult | null>(null);
  const [isOpening, startOpening] = useTransition();
  const id = fieldId(name);
  const ids = (fieldValue as string[] | undefined) ?? [];
  const error = fieldState.error?.message ?? (fieldState.error === undefined ? undefined : 'Check the images in the gallery');

  const move = (index: number, offset: -1 | 1): void => {
    const next = [...ids];
    const [moved] = next.splice(index, 1);
    if (moved !== undefined) {
      next.splice(index + offset, 0, moved);
      onChange(next);
    }
  };

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-3">
      <span id={`${id}-label`} className="text-sm font-medium">
        {label}
      </span>
      {description !== undefined && <FieldDescription>{description}</FieldDescription>}
      {ids.length > 0 && (
        <ol aria-label={`${label} images`} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ids.map((mediaId, index) => {
            const media = picked[mediaId] ?? knownMedia[mediaId];
            const position = index + 1;
            return (
              <li key={mediaId} className="flex flex-col gap-1.5">
                {media === undefined ? (
                  <div className="flex aspect-square items-center justify-center rounded-md border border-dashed p-2 text-center text-xs text-muted-foreground">
                    No longer in the library
                  </div>
                ) : (
                  <MediaThumbnail media={media} sizes="(min-width: 640px) 10rem, 45vw" />
                )}
                <span className="truncate text-xs">{media?.fileName ?? `Image ${position}`}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move image ${position} earlier`}
                    disabled={index === 0}
                    onClick={() => {
                      move(index, -1);
                    }}
                  >
                    <ArrowLeftIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move image ${position} later`}
                    disabled={index === ids.length - 1}
                    onClick={() => {
                      move(index, 1);
                    }}
                  >
                    <ArrowRightIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove image ${position}`}
                    onClick={() => {
                      onChange(ids.filter((_value, itemIndex) => itemIndex !== index));
                    }}
                  >
                    <Trash2Icon aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex items-center gap-3">
        <Button
          ref={ref}
          type="button"
          variant="outline"
          size="sm"
          disabled={ids.length >= maxItems || isOpening}
          onClick={() => {
            startOpening(async () => {
              const page = await loadFirstPickerPage('image');
              setFirstPage(page);
            });
          }}
        >
          <PlusIcon aria-hidden />
          {isOpening ? 'Opening…' : 'Add images'}
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {ids.length} of {maxItems}
        </span>
      </div>
      {error !== undefined && <FieldError>{error}</FieldError>}
      {firstPage !== null && (
        <MediaPickerDialog
          kind="image"
          isMultiple
          firstPage={firstPage}
          onClose={() => {
            setFirstPage(null);
          }}
          onSelect={(chosen) => {
            const added = chosen.filter((media) => !ids.includes(media.id)).slice(0, maxItems - ids.length);
            setPicked((current) => ({ ...current, ...Object.fromEntries(added.map((media) => [media.id, media])) }));
            onChange([...ids, ...added.map((media) => media.id)]);
            setFirstPage(null);
          }}
        />
      )}
    </div>
  );
}
