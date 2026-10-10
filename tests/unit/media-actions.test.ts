import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteMedia, loadPickerPage, requestUpload } from '@/features/media/actions';
import { getMediaByIds } from '@/features/media/queries';
import { describeUsage, UPLOADS_NOT_SET_UP_MESSAGE } from '@/features/media/schemas';
import { apiRequest, apiRequestPage } from '@/lib/api/api-client';
import { ApiNotFoundError, ApiUnavailableError } from '@/lib/api/api-errors';

vi.mock('@/lib/api/api-client', () => ({ apiRequest: vi.fn(), apiRequestPage: vi.fn(), apiRequestAll: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);
const ID = '0123456789abcdef01234567';
const upload = { fileName: 'cv.pdf', mimeType: 'application/pdf', size: 1000, width: null, height: null, altText: '' };

beforeEach(() => {
  apiRequestMock.mockReset();
  vi.mocked(apiRequestPage).mockReset();
});

describe('requestUpload', () => {
  it('returns the upload form for the browser', async () => {
    apiRequestMock.mockResolvedValue({ media: { id: ID }, upload: { url: 'https://s3', fields: { key: 'k' } } });

    expect(await requestUpload(upload)).toMatchObject({ ok: true, data: { mediaId: ID, url: 'https://s3', fields: { key: 'k' } } });
    expect(apiRequestMock).toHaveBeenCalledWith('/media/upload-url', expect.objectContaining({ body: { ...upload, altText: null } }));
  });

  it('explains that uploads are not set up when the backend has no storage', async () => {
    apiRequestMock.mockRejectedValue(new ApiUnavailableError('Media storage is not configured', { isReportedByBackend: true }));

    expect(await requestUpload(upload)).toEqual({ ok: false, formError: UPLOADS_NOT_SET_UP_MESSAGE });
  });

  it('says the server cannot be reached when the backend is down', async () => {
    apiRequestMock.mockRejectedValue(new ApiUnavailableError());

    expect(!(await requestUpload(upload)).ok && (await requestUpload(upload))).toMatchObject({
      formError: expect.stringMatching(/Can’t reach the server/) as string,
    });
  });

  it('refuses files over the size limit without calling the backend', async () => {
    expect(await requestUpload({ ...upload, size: 11 * 1024 * 1024 })).toEqual({
      ok: false,
      fieldErrors: { size: 'Files of this type can be at most 10 MB' },
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});

describe('deleteMedia', () => {
  it('forces the delete only after confirming a file in use', async () => {
    apiRequestMock.mockResolvedValue(null);

    await deleteMedia(ID, 'cv.pdf', true);
    expect(apiRequestMock).toHaveBeenLastCalledWith(
      `/media/${ID}`,
      expect.objectContaining({ method: 'DELETE', query: { force: 'true' } }),
    );

    await deleteMedia(ID, 'cv.pdf', false);
    expect(apiRequestMock).toHaveBeenLastCalledWith(`/media/${ID}`, expect.not.objectContaining({ query: expect.anything() as unknown }));
  });
});

describe('loadPickerPage', () => {
  it('loads one kind of file with whether uploads work', async () => {
    const page = { items: [], pagination: { page: 1, pageSize: 24, totalItems: 0, totalPages: 0 } };
    vi.mocked(apiRequestPage).mockResolvedValue(page);
    apiRequestMock.mockResolvedValue({ isConfigured: false });

    expect(await loadPickerPage('image', 1)).toEqual({ ok: true, message: '', data: { page, isUploadConfigured: false } });
    expect(apiRequestPage).toHaveBeenCalledWith('/media', expect.objectContaining({ query: { kind: 'image', page: 1, pageSize: 24 } }));
    expect(await loadPickerPage('video', 1)).toMatchObject({ ok: false });
  });
});

describe('getMediaByIds', () => {
  it('loads each referenced file once and leaves out deleted ones', async () => {
    const other = 'fedcba9876543210fedcba98';
    apiRequestMock.mockImplementation((path) =>
      path.endsWith(ID) ? Promise.resolve({ id: ID, fileName: 'a.png' }) : Promise.reject(new ApiNotFoundError('File not found')),
    );

    const found = await getMediaByIds([ID, ID, other, null, 'not-an-id']);

    expect(Object.keys(found)).toEqual([ID]);
    expect(apiRequestMock).toHaveBeenCalledTimes(2);
  });
});

describe('describeUsage', () => {
  it('links to the item that uses the file', () => {
    expect(describeUsage({ resource: 'project', id: ID, label: 'Portfolio CMS', field: 'coverImage' })).toEqual({
      href: `/projects/${ID}`,
      text: 'Portfolio CMS (cover image)',
    });
    expect(describeUsage({ resource: 'profile', id: 'p', label: 'Profile', field: 'resume' }).href).toBe('/profile');
  });
});
