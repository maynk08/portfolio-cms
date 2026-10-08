import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { deleteResource, quoteLabel, reorderResources, saveResource, setResourceFlag } from '@/lib/actions/resource-actions';
import { apiRequest } from '@/lib/api/api-client';
import { ApiNotFoundError } from '@/lib/api/api-errors';
import { getResourceOrNotFound } from '@/lib/api/resource-queries';

const { NotFoundSignal } = vi.hoisted(() => ({ NotFoundSignal: class NotFoundSignal extends Error {} }));

vi.mock('@/lib/api/api-client', () => ({ apiRequest: vi.fn(), apiRequestAll: vi.fn(), apiRequestPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new NotFoundSignal();
  },
  redirect: vi.fn(),
}));

const apiRequestMock = vi.mocked(apiRequest);
const ID = '0123456789abcdef01234567';
const schema = z.object({ title: z.string().trim().min(1, 'Enter a title') });
const describeItem = (input: { title: string }) => `Project "${input.title}"`;

beforeEach(() => {
  apiRequestMock.mockReset();
});

describe('saveResource', () => {
  it('creates with POST and names the item in the message', async () => {
    apiRequestMock.mockResolvedValue({ id: ID });

    const result = await saveResource({ path: '/projects', schema, values: { title: ' Site ' }, describe: describeItem });

    expect(result).toEqual({ ok: true, message: 'Project "Site" created', data: { id: ID } });
    expect(apiRequestMock).toHaveBeenCalledWith('/projects', expect.objectContaining({ method: 'POST', body: { title: 'Site' } }));
  });

  it('updates with PATCH on the item URL', async () => {
    apiRequestMock.mockResolvedValue({ id: ID });

    const result = await saveResource({ path: '/projects', id: ID, schema, values: { title: 'Site' }, describe: describeItem });

    expect(result).toMatchObject({ ok: true, message: 'Project "Site" saved' });
    expect(apiRequestMock).toHaveBeenCalledWith(`/projects/${ID}`, expect.objectContaining({ method: 'PATCH' }));
  });

  it('never puts a malformed ID into the URL', async () => {
    const result = await saveResource({
      path: '/projects',
      id: '../auth/password',
      schema,
      values: { title: 'Site' },
      describe: describeItem,
    });

    expect(result).toMatchObject({ ok: false });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('returns field errors without calling the backend', async () => {
    expect(await saveResource({ path: '/projects', schema, values: { title: '' }, describe: describeItem })).toEqual({
      ok: false,
      fieldErrors: { title: 'Enter a title' },
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});

describe('list actions', () => {
  it('deletes and confirms with the label', async () => {
    apiRequestMock.mockResolvedValue(null);

    expect(await deleteResource('/projects', ID, 'Project "Site"')).toMatchObject({ ok: true, message: 'Project "Site" deleted' });
    expect(apiRequestMock).toHaveBeenCalledWith(`/projects/${ID}`, expect.objectContaining({ method: 'DELETE' }));
  });

  it('saves a single flag', async () => {
    apiRequestMock.mockResolvedValue({ id: ID });

    await setResourceFlag('/projects', ID, 'isFeatured', true, 'Featured');

    expect(apiRequestMock).toHaveBeenCalledWith(
      `/projects/${ID}`,
      expect.objectContaining({ method: 'PATCH', body: { isFeatured: true } }),
    );
  });

  it('refuses a flag that is not a boolean', async () => {
    expect(await setResourceFlag('/projects', ID, 'isVisible', 'yes', 'x')).toMatchObject({ ok: false });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('sends a new order and refuses malformed IDs', async () => {
    apiRequestMock.mockResolvedValue(null);

    expect(await reorderResources('/projects', [ID])).toMatchObject({ ok: true });
    expect(apiRequestMock).toHaveBeenCalledWith('/projects/order', expect.objectContaining({ method: 'PATCH', body: { ids: [ID] } }));
    expect(await reorderResources('/projects', ['nope'])).toMatchObject({ ok: false });
  });

  it('quotes labels and falls back for missing ones', () => {
    expect(quoteLabel('Site')).toBe('"Site"');
    expect(quoteLabel('')).toBe('The item');
  });
});

describe('getResourceOrNotFound', () => {
  it('shows the not-found page for a malformed ID without calling the backend', async () => {
    await expect(getResourceOrNotFound('/projects', 'nope', schema)).rejects.toBeInstanceOf(NotFoundSignal);
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('shows the not-found page when the backend does not know the ID', async () => {
    apiRequestMock.mockRejectedValue(new ApiNotFoundError('Project not found'));

    await expect(getResourceOrNotFound('/projects', ID, schema)).rejects.toBeInstanceOf(NotFoundSignal);
  });
});
