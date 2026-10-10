// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ActionForm } from '@/components/forms/action-form';
import { useActionForm } from '@/components/forms/use-action-form';
import { MediaDetailsSheet } from '@/features/media/components/media-details-sheet';
import { MediaField } from '@/features/media/components/media-field';
import { UploadPanel } from '@/features/media/components/upload-panel';

import { navigationState, resetNavigationMocks, routerMock } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { Media } from '@/features/media/schemas';
import type * as UploadFileModule from '@/features/media/upload-file';
import type { ActionResult } from '@/lib/actions/action-result';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));
// next/image needs Next's image loader, which these component tests do not run.
vi.mock('next/image', () => ({ default: ({ src }: { src: string }) => <span data-image-src={src} /> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/media/actions', () => ({
  deleteMedia: vi.fn(),
  saveAltText: vi.fn(),
  setMediaVisibility: vi.fn(),
  loadPickerPage: vi.fn(),
  requestUpload: vi.fn(),
  completeUpload: vi.fn(),
}));
vi.mock('@/features/media/upload-file', async (importOriginal) => ({
  ...(await importOriginal<typeof UploadFileModule>()),
  uploadFile: vi.fn(),
}));

const { deleteMedia, loadPickerPage } = await import('@/features/media/actions');
const { uploadFile } = await import('@/features/media/upload-file');

function media(id: string, fileName: string, overrides: Partial<Media> = {}): Media {
  return {
    id: id.repeat(24),
    url: `https://cdn.test/${fileName}`,
    fileName,
    mimeType: 'image/png',
    size: 2048,
    width: 640,
    height: 400,
    altText: 'Alt',
    isVisible: true,
    createdAt: '2026-10-10T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  resetNavigationMocks();
  navigationState.pathname = '/media';
  vi.mocked(toast.success).mockClear();
  vi.mocked(deleteMedia).mockReset();
  vi.mocked(uploadFile).mockReset();
});

describe('UploadPanel', () => {
  it('explains that uploads are not set up', () => {
    renderWithProviders(<UploadPanel isConfigured={false} />);

    expect(screen.getByRole('status')).toHaveTextContent('Uploads are not set up yet');
    expect(screen.queryByLabelText('Choose files to upload')).not.toBeInTheDocument();
  });

  it('refuses a file it cannot upload straight away, and uploads the rest with alt text', async () => {
    const uploaded = media('a', 'shot.png');
    vi.mocked(uploadFile).mockImplementation((_file, options) => {
      options.onProgress(0.4);
      return Promise.resolve<ActionResult<Media>>({ ok: true, message: '', data: uploaded });
    });
    const onUploaded = vi.fn();
    const { user } = renderWithProviders(<UploadPanel isConfigured onUploaded={onUploaded} />);

    // Dropping files skips the file dialog's type filter, so the panel must catch an SVG itself.
    fireEvent.drop(screen.getByText(/Drop files here/).closest('div') as HTMLElement, {
      dataTransfer: {
        files: [new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }), new File(['png'], 'shot.png', { type: 'image/png' })],
      },
    });
    const queue = screen.getByRole('list', { name: 'Files to upload' });
    expect(within(queue).getByRole('alert')).toHaveTextContent('SVG files are not allowed');

    await user.type(screen.getByLabelText('Alt text'), 'A screenshot');
    await user.click(screen.getByRole('button', { name: 'Upload 1 file' }));

    await waitFor(() => {
      expect(within(queue).getByText('Uploaded')).toBeInTheDocument();
    });
    expect(uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'shot.png' }),
      expect.objectContaining({ altText: 'A screenshot' }),
    );
    expect(onUploaded).toHaveBeenCalledWith(uploaded);
    expect(toast.success).toHaveBeenCalledWith('1 file uploaded');
  });
});

describe('MediaDetailsSheet', () => {
  it('lists where a file is used and deletes it everywhere only after confirming', async () => {
    vi.mocked(deleteMedia).mockResolvedValue({ ok: true, message: '"shot.png" deleted and removed everywhere it was used', data: null });
    const file = media('a', 'shot.png');
    const { user } = renderWithProviders(
      <MediaDetailsSheet media={file} usages={[{ resource: 'project', id: 'p'.repeat(24), label: 'Portfolio CMS', field: 'gallery' }]} />,
    );

    expect(screen.getByRole('link', { name: 'Portfolio CMS (gallery)' })).toHaveAttribute('href', `/projects/${'p'.repeat(24)}`);
    await user.click(screen.getByRole('button', { name: 'Delete file' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete "shot.png"?' });
    expect(confirm).toHaveTextContent('It is used in one place.');
    await user.click(within(confirm).getByRole('button', { name: 'Delete anyway' }));

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith('/media', { scroll: false });
    });
    expect(deleteMedia).toHaveBeenCalledWith(file.id, 'shot.png', true);
  });

  it('deletes an unused file without forcing', async () => {
    vi.mocked(deleteMedia).mockResolvedValue({ ok: true, message: 'deleted', data: null });
    const file = media('b', 'unused.png');
    const { user } = renderWithProviders(<MediaDetailsSheet media={file} usages={[]} />);

    expect(screen.getByText('Not used anywhere yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete file' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteMedia).toHaveBeenCalledWith(file.id, 'unused.png', false);
    });
  });
});

const photoSchema = z.object({ photo: z.string().nullable() });

function PhotoForm({ initial, knownMedia }: { initial: string | null; knownMedia: Record<string, Media> }) {
  const actionForm = useActionForm({
    schema: photoSchema,
    defaultValues: { photo: initial },
    action: () => Promise.resolve<ActionResult>({ ok: true, message: 'Saved', data: null }),
  });
  return (
    <ActionForm actionForm={actionForm} secondaryAction={{ type: 'none' }} hasRequiredFields={false}>
      <MediaField control={actionForm.form.control} name="photo" label="Photo" kind="image" knownMedia={knownMedia} />
    </ActionForm>
  );
}

describe('MediaField', () => {
  it('chooses a file from the picker and warns when it has no alt text', async () => {
    const choice = media('c', 'portrait.png', { altText: null });
    vi.mocked(loadPickerPage).mockResolvedValue({
      ok: true,
      message: '',
      data: { page: { items: [choice], pagination: { page: 1, pageSize: 24, totalItems: 1, totalPages: 1 } }, isUploadConfigured: false },
    });
    const { user } = renderWithProviders(<PhotoForm initial={null} knownMedia={{}} />);
    const field = screen.getByRole('group', { name: 'Photo' });
    expect(field).toHaveTextContent('No image chosen');

    await user.click(within(field).getByRole('button', { name: 'Choose' }));
    const picker = await screen.findByRole('dialog', { name: 'Choose an image' });
    expect(loadPickerPage).toHaveBeenCalledWith('image', 1);
    await user.click(await within(picker).findByRole('button', { name: /portrait\.png/ }));
    await user.click(within(picker).getByRole('button', { name: 'Use this file' }));

    expect(field).toHaveTextContent('portrait.png');
    expect(screen.getByText('This image has no alt text yet. Add it in the media library.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
  });

  it('removes the chosen file', async () => {
    const current = media('d', 'old.png');
    const { user } = renderWithProviders(<PhotoForm initial={current.id} knownMedia={{ [current.id]: current }} />);
    const field = screen.getByRole('group', { name: 'Photo' });
    expect(field).toHaveTextContent('old.png');

    await user.click(within(field).getByRole('button', { name: 'Remove' }));

    expect(field).toHaveTextContent('No image chosen');
    expect(within(field).getByRole('button', { name: 'Choose' })).toBeInTheDocument();
  });
});
