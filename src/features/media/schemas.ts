import { z } from 'zod';

import { optionalText } from '@/lib/validation/common-schemas';
import { TEXT_LIMITS } from '@/lib/validation/text-limits';

export const MEDIA_PATH = '/media';

export const UPLOADS_NOT_SET_UP_MESSAGE = 'Uploads are not set up yet: the backend needs the AWS settings from notes/aws-setup.md.';
export const MEGABYTE = 1024 * 1024;

export type MediaKind = 'image' | 'document';

// The backend's upload rules (`src/config/media-types.ts`), repeated so files can be checked before uploading.
export const MEDIA_TYPES = {
  'image/jpeg': { kind: 'image', label: 'JPEG', maxBytes: 5 * MEGABYTE },
  'image/png': { kind: 'image', label: 'PNG', maxBytes: 5 * MEGABYTE },
  'image/webp': { kind: 'image', label: 'WebP', maxBytes: 5 * MEGABYTE },
  'image/avif': { kind: 'image', label: 'AVIF', maxBytes: 5 * MEGABYTE },
  'image/gif': { kind: 'image', label: 'GIF', maxBytes: 5 * MEGABYTE },
  'application/pdf': { kind: 'document', label: 'PDF', maxBytes: 10 * MEGABYTE },
} as const satisfies Record<string, { kind: MediaKind; label: string; maxBytes: number }>;

export type MediaMimeType = keyof typeof MEDIA_TYPES;

export const MEDIA_MIME_TYPES = Object.keys(MEDIA_TYPES) as [MediaMimeType, ...MediaMimeType[]];

export function isMediaMimeType(mimeType: string): mimeType is MediaMimeType {
  return Object.hasOwn(MEDIA_TYPES, mimeType);
}

export function mediaKindOf(mimeType: string): MediaKind {
  return isMediaMimeType(mimeType) ? MEDIA_TYPES[mimeType].kind : 'document';
}

export function acceptedMimeTypes(kind?: MediaKind): MediaMimeType[] {
  return MEDIA_MIME_TYPES.filter((mimeType) => kind === undefined || MEDIA_TYPES[mimeType].kind === kind);
}

export const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  altText: z.string().nullish(),
  isVisible: z.boolean(),
  createdAt: z.string(),
});

export type Media = z.infer<typeof mediaSchema>;

export const MEDIA_USAGE_RESOURCES = ['profile', 'experience', 'project', 'education', 'certification'] as const;

export const mediaUsageSchema = z.object({
  resource: z.enum(MEDIA_USAGE_RESOURCES),
  id: z.string(),
  label: z.string(),
  field: z.string(),
});

export type MediaUsage = z.infer<typeof mediaUsageSchema>;

const FIELD_LABELS: Record<string, string> = {
  photo: 'photo',
  resume: 'résumé',
  companyLogo: 'company logo',
  coverImage: 'cover image',
  gallery: 'gallery',
  logo: 'logo',
  badge: 'badge',
};

// Where to edit the item that uses a file, and how to describe the use: "Portfolio CMS (cover image)".
export function describeUsage(usage: MediaUsage): { href: string; text: string } {
  const listPaths: Record<MediaUsage['resource'], string> = {
    profile: '/profile',
    experience: `/experience/${usage.id}`,
    project: `/projects/${usage.id}`,
    education: `/education/${usage.id}`,
    certification: `/certifications/${usage.id}`,
  };
  return { href: listPaths[usage.resource], text: `${usage.label} (${FIELD_LABELS[usage.field] ?? usage.field})` };
}

// Sent to the upload Server Action; the backend checks the same rules again.
export const uploadRequestSchema = z
  .object({
    fileName: z.string().trim().min(1).max(TEXT_LIMITS.title),
    mimeType: z.enum(MEDIA_MIME_TYPES, 'Only JPEG, PNG, WebP, AVIF and GIF images and PDF files can be uploaded'),
    size: z.number().int().min(1),
    width: z.number().int().min(1).nullable(),
    height: z.number().int().min(1).nullable(),
    altText: optionalText(TEXT_LIMITS.listItem),
  })
  .superRefine((input, context) => {
    const { maxBytes } = MEDIA_TYPES[input.mimeType];
    if (input.size > maxBytes) {
      context.addIssue({ code: 'custom', path: ['size'], message: `Files of this type can be at most ${maxBytes / MEGABYTE} MB` });
    }
  });

export type UploadRequest = z.input<typeof uploadRequestSchema>;

export const uploadTicketSchema = z.object({
  media: z.object({ id: z.string() }),
  upload: z.object({ url: z.string(), fields: z.record(z.string(), z.string()) }),
});

export const altTextFormSchema = z.object({ altText: optionalText(TEXT_LIMITS.listItem) });

export type AltTextFormValues = z.input<typeof altTextFormSchema>;
