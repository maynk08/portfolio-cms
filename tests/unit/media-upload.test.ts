// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeUpload, requestUpload } from '@/features/media/actions';
import { checkFile, uploadFile } from '@/features/media/upload-file';

vi.mock('@/features/media/actions', () => ({ requestUpload: vi.fn(), completeUpload: vi.fn() }));

const MB = 1024 * 1024;

function fileOf(name: string, type: string, bytes: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

// A stand-in for the browser's XMLHttpRequest that reports progress and then finishes with `status`.
function installFakeXhr(status: number, failNetwork = false) {
  const sent: { url: string; body: FormData }[] = [];
  class FakeXhr {
    status = 0;
    private listeners = new Map<string, () => void>();
    upload = {
      listeners: new Map<string, (event: { lengthComputable: boolean; loaded: number; total: number }) => void>(),
      addEventListener(type: string, listener: (event: { lengthComputable: boolean; loaded: number; total: number }) => void) {
        this.listeners.set(type, listener);
      },
    };
    private url = '';
    addEventListener(type: string, listener: () => void) {
      this.listeners.set(type, listener);
    }
    open(_method: string, url: string) {
      this.url = url;
    }
    send(body: FormData) {
      sent.push({ url: this.url, body });
      this.upload.listeners.get('progress')?.({ lengthComputable: true, loaded: 50, total: 100 });
      if (failNetwork) {
        this.listeners.get('error')?.();
        return;
      }
      this.status = status;
      this.listeners.get('load')?.();
    }
  }
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
  return sent;
}

beforeEach(() => {
  vi.mocked(requestUpload).mockReset();
  vi.mocked(completeUpload).mockReset();
  vi.unstubAllGlobals();
});

describe('checkFile', () => {
  it.each([
    ['an SVG', fileOf('logo.svg', 'image/svg+xml', 1000), undefined, /SVG files are not allowed/],
    ['an image over 5 MB', fileOf('big.png', 'image/png', 6 * MB), undefined, 'This file is too large: PNG files can be at most 5 MB.'],
    [
      'a PDF for an image field',
      fileOf('cv.pdf', 'application/pdf', 1000),
      'image' as const,
      'Choose an image (JPEG, PNG, WebP, AVIF or GIF).',
    ],
    ['an empty file', fileOf('empty.png', 'image/png', 0), undefined, 'This file is empty.'],
  ])('refuses %s', (_case, file, kind, message) => {
    expect(checkFile(file, kind)).toEqual(
      expect.stringMatching(message instanceof RegExp ? message : new RegExp(`^${message.replace(/[.()]/g, '\\$&')}$`)),
    );
  });

  it('accepts a PDF up to 10 MB', () => {
    expect(checkFile(fileOf('cv.pdf', 'application/pdf', 9 * MB))).toBeNull();
  });
});

describe('uploadFile', () => {
  const ticket = {
    ok: true as const,
    message: '',
    data: { mediaId: 'm1', url: 'https://bucket.s3.amazonaws.com', fields: { key: 'media/m1/cv.pdf', Policy: 'p' } },
  };

  it('asks for a form, posts the file to storage with progress, then confirms', async () => {
    vi.mocked(requestUpload).mockResolvedValue(ticket);
    vi.mocked(completeUpload).mockResolvedValue({ ok: true, message: '"cv.pdf" uploaded', data: { id: 'm1' } as never });
    const sent = installFakeXhr(204);
    const progress: number[] = [];

    const result = await uploadFile(fileOf('cv.pdf', 'application/pdf', 1000), {
      altText: '',
      onProgress: (value) => progress.push(value),
    });

    expect(result).toMatchObject({ ok: true });
    expect(requestUpload).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'cv.pdf', mimeType: 'application/pdf', size: 1000, width: null }),
    );
    expect(sent[0]?.url).toBe('https://bucket.s3.amazonaws.com');
    expect([...(sent[0]?.body.keys() ?? [])]).toEqual(['key', 'Policy', 'file']);
    expect(progress).toEqual([0.5, 1]);
    expect(completeUpload).toHaveBeenCalledWith('m1');
  });

  it('stops before contacting storage when the file is not allowed', async () => {
    const result = await uploadFile(fileOf('logo.svg', 'image/svg+xml', 10), { altText: '', onProgress: vi.fn() });

    expect(result).toMatchObject({ ok: false });
    expect(requestUpload).not.toHaveBeenCalled();
  });

  it('passes on why the backend refused, such as uploads not being set up', async () => {
    vi.mocked(requestUpload).mockResolvedValue({ ok: false, formError: 'Uploads are not set up yet' });

    expect(await uploadFile(fileOf('cv.pdf', 'application/pdf', 10), { altText: '', onProgress: vi.fn() })).toEqual({
      ok: false,
      formError: 'Uploads are not set up yet',
    });
  });

  it.each([
    ['storage refuses the file', 403, false],
    ['the connection drops', 0, true],
  ])('does not confirm when %s', async (_case, status, failNetwork) => {
    vi.mocked(requestUpload).mockResolvedValue(ticket);
    installFakeXhr(status, failNetwork);

    const result = await uploadFile(fileOf('cv.pdf', 'application/pdf', 10), { altText: '', onProgress: vi.fn() });

    expect(result).toEqual({ ok: false, formError: 'The file could not be sent to storage. Check your connection and try again.' });
    expect(completeUpload).not.toHaveBeenCalled();
  });
});
