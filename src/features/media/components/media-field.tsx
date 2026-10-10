'use client';

import { ImageOffIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useController } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { MediaPickerDialog, loadFirstPickerPage } from '@/features/media/components/media-picker-dialog';
import { MediaThumbnail } from '@/features/media/components/media-thumbnail';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { PickerPageResult } from '@/features/media/components/media-picker-dialog';
import type { Media, MediaKind } from '@/features/media/schemas';
import type { FieldValues } from 'react-hook-form';

type MediaFieldProps<T extends FieldValues, TTransformed extends FieldValues> = Omit<FormFieldProps<T, TTransformed>, 'isRequired'> & {
  kind: MediaKind;
  // The files the form already refers to, loaded by the page, so their previews show at once.
  knownMedia: Record<string, Media>;
};

// One file from the media library (photo, résumé, logo, cover image, badge): choose, replace or remove it.
export function MediaField<T extends FieldValues, TTransformed extends FieldValues>({
  control,
  name,
  label,
  description,
  kind,
  knownMedia,
}: MediaFieldProps<T, TTransformed>) {
  const {
    field: { ref, value: fieldValue, onChange },
    fieldState,
  } = useController({ control, name });
  const [picked, setPicked] = useState<Record<string, Media>>({});
  const [firstPage, setFirstPage] = useState<PickerPageResult | null>(null);
  const [isOpening, startOpening] = useTransition();
  const id = fieldId(name);
  const mediaId = (fieldValue as string | null | undefined) ?? null;
  const media = mediaId === null ? null : (picked[mediaId] ?? knownMedia[mediaId] ?? null);
  const isMissingAltText = kind === 'image' && media !== null && (media.altText ?? '') === '';
  const error = fieldState.error?.message;

  const openPicker = (): void => {
    startOpening(async () => {
      const page = await loadFirstPickerPage(kind);
      setFirstPage(page);
    });
  };

  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel id={`${id}-label`}>{label}</FieldLabel>
      <div role="group" aria-labelledby={`${id}-label`} className="flex items-center gap-4">
        {media !== null ? (
          <MediaThumbnail media={media} sizes="5rem" className="size-20 shrink-0" />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            None
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-sm">
            {media !== null
              ? media.fileName
              : mediaId === null
                ? `No ${kind === 'image' ? 'image' : 'file'} chosen`
                : 'This file is no longer in the library'}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button ref={ref} type="button" variant="outline" size="sm" disabled={isOpening} onClick={openPicker}>
              {isOpening ? 'Opening…' : mediaId === null ? 'Choose' : 'Replace'}
            </Button>
            {mediaId !== null && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {isMissingAltText && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ImageOffIcon aria-hidden className="size-4" />
          This image has no alt text yet. Add it in the media library.
        </p>
      )}
      {description !== undefined && <FieldDescription>{description}</FieldDescription>}
      {error !== undefined && <FieldError>{error}</FieldError>}
      {firstPage !== null && (
        <MediaPickerDialog
          kind={kind}
          isMultiple={false}
          firstPage={firstPage}
          onClose={() => {
            setFirstPage(null);
          }}
          onSelect={([chosen]) => {
            if (chosen !== undefined) {
              setPicked((current) => ({ ...current, [chosen.id]: chosen }));
              onChange(chosen.id);
            }
            setFirstPage(null);
          }}
        />
      )}
    </Field>
  );
}
