'use client';

import { CheckCircle2Icon, UploadIcon, XIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { notifyError, notifySuccess } from '@/components/feedback/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { UPLOADS_NOT_SET_UP_MESSAGE, acceptedMimeTypes } from '@/features/media/schemas';
import { checkFile, uploadFile } from '@/features/media/upload-file';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/format-file-size';

import type { Media, MediaKind } from '@/features/media/schemas';

type QueuedFile = {
  key: number;
  file: File;
  altText: string;
  // `waiting` until Upload is pressed; a problem found before uploading is shown at once.
  state: { status: 'waiting' } | { status: 'uploading'; progress: number } | { status: 'done' } | { status: 'failed'; message: string };
};

type UploadPanelProps = {
  isConfigured: boolean;
  // Limits the files to one kind (the picker for an image field accepts images only).
  kind?: MediaKind;
  onUploaded?: (media: Media) => void;
};

let nextKey = 0;

// Choose or drop several files, add alt text to images, then upload them one after another with a progress bar each.
export function UploadPanel({ isConfigured, kind, onUploaded }: UploadPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const accept = acceptedMimeTypes(kind).join(',');

  if (!isConfigured) {
    return (
      <p role="status" className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        {UPLOADS_NOT_SET_UP_MESSAGE}
      </p>
    );
  }

  const addFiles = (files: FileList | null): void => {
    const added = [...(files ?? [])].map((file): QueuedFile => {
      nextKey += 1;
      const problem = checkFile(file, kind);
      return { key: nextKey, file, altText: '', state: problem === null ? { status: 'waiting' } : { status: 'failed', message: problem } };
    });
    setQueue((current) => [...current.filter((item) => item.state.status !== 'done'), ...added]);
  };

  const update = (key: number, change: Partial<QueuedFile>): void => {
    setQueue((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));
  };

  const uploadAll = async (): Promise<void> => {
    setIsUploading(true);
    const waiting = queue.filter((item) => item.state.status === 'waiting');
    let uploadedCount = 0;
    // One at a time, so a slow connection is not split between several files.
    for (const item of waiting) {
      update(item.key, { state: { status: 'uploading', progress: 0 } });
      const result = await uploadFile(item.file, {
        altText: item.altText,
        kind,
        onProgress: (progress) => {
          update(item.key, { state: { status: 'uploading', progress } });
        },
      });
      if (result.ok) {
        uploadedCount += 1;
        update(item.key, { state: { status: 'done' } });
        onUploaded?.(result.data);
      } else {
        const message = result.formError ?? 'The upload failed.';
        update(item.key, { state: { status: 'failed', message } });
        notifyError(`"${item.file.name}" was not uploaded: ${message}`);
      }
    }
    setIsUploading(false);
    if (uploadedCount > 0) {
      notifySuccess(uploadedCount === 1 ? '1 file uploaded' : `${uploadedCount} files uploaded`);
    }
  };

  const waitingCount = queue.filter((item) => item.state.status === 'waiting').length;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
          isDragging && 'border-primary bg-muted/50',
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <UploadIcon aria-hidden className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files here, or{' '}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            choose files
          </Button>
          . {kind === 'document' ? 'PDF up to 10 MB.' : kind === 'image' ? 'Images up to 5 MB.' : 'Images up to 5 MB, PDF up to 10 MB.'}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          aria-label="Choose files to upload"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul aria-label="Files to upload" className="flex flex-col gap-3">
          {queue.map((item) => (
            <QueueRow
              key={item.key}
              item={item}
              isLocked={isUploading}
              onAltTextChange={(altText) => {
                update(item.key, { altText });
              }}
              onRemove={() => {
                setQueue((current) => current.filter((queued) => queued.key !== item.key));
              }}
            />
          ))}
        </ul>
      )}

      {waitingCount > 0 && (
        <div className="flex justify-end">
          <Button type="button" disabled={isUploading} onClick={() => void uploadAll()}>
            {isUploading ? 'Uploading…' : waitingCount === 1 ? 'Upload 1 file' : `Upload ${waitingCount} files`}
          </Button>
        </div>
      )}
    </div>
  );
}

type QueueRowProps = {
  item: QueuedFile;
  isLocked: boolean;
  onAltTextChange: (altText: string) => void;
  onRemove: () => void;
};

function QueueRow({ item, isLocked, onAltTextChange, onRemove }: QueueRowProps) {
  const altTextId = useId();
  const isImage = item.file.type.startsWith('image/');
  const { state } = item;

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.file.name}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{formatFileSize(item.file.size)}</span>
        {state.status === 'done' && (
          <span className="flex items-center gap-1 text-sm">
            <CheckCircle2Icon aria-hidden className="size-4" />
            Uploaded
          </span>
        )}
        {(state.status === 'waiting' || state.status === 'failed') && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove "${item.file.name}"`}
            disabled={isLocked}
            onClick={onRemove}
          >
            <XIcon aria-hidden />
          </Button>
        )}
      </div>
      {state.status === 'waiting' && isImage && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={altTextId}>Alt text</Label>
          <Input
            id={altTextId}
            value={item.altText}
            placeholder="Describe the image for people who cannot see it"
            disabled={isLocked}
            onChange={(event) => {
              onAltTextChange(event.target.value);
            }}
          />
        </div>
      )}
      {state.status === 'uploading' && <Progress value={Math.round(state.progress * 100)} aria-label={`Uploading "${item.file.name}"`} />}
      {state.status === 'failed' && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </li>
  );
}
