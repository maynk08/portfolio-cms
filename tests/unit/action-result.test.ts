import { refresh } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { runAction, toActionFailure, toValidationFailure } from '@/lib/actions/action-result';
import {
  ApiConflictError,
  ApiError,
  ApiNotFoundError,
  ApiRateLimitError,
  ApiUnavailableError,
  ApiValidationError,
} from '@/lib/api/api-errors';

beforeEach(() => {
  vi.mocked(refresh).mockClear();
});

describe('toActionFailure', () => {
  it('keeps the first message per field from a validation error', () => {
    const error = new ApiValidationError('Validation failed', [
      { field: 'title', message: 'Required' },
      { field: 'title', message: 'Too long' },
      { field: 'gallery.2', message: 'File not found' },
    ]);

    expect(toActionFailure(error)).toEqual({ ok: false, fieldErrors: { title: 'Required', 'gallery.2': 'File not found' } });
  });

  it.each([
    [
      'a conflict',
      new ApiConflictError('This slug is already used by another project', null),
      'This slug is already used by another project',
    ],
    ['a missing item', new ApiNotFoundError('Project not found'), 'Project not found'],
    ['rate limiting', new ApiRateLimitError('Too many', 120), 'Too many requests. Try again in 2 minutes.'],
    ['an unreachable backend', new ApiUnavailableError(), 'Can’t reach the server. Check that the backend is running, then try again.'],
    ['any other API error', new ApiError(500, 'Internal'), 'Something went wrong. Try again.'],
  ])('describes %s', (_case, error, message) => {
    expect(toActionFailure(error)).toEqual({ ok: false, formError: message });
  });

  it('rethrows errors that are not API errors', () => {
    const bug = new TypeError('bug');

    expect(() => toActionFailure(bug)).toThrow(bug);
  });
});

describe('runAction', () => {
  it('returns the data with a message and refreshes the page', async () => {
    const result = await runAction(
      () => Promise.resolve({ title: 'Site' }),
      (project) => `Project "${project.title}" saved`,
    );

    expect(result).toEqual({ ok: true, message: 'Project "Site" saved', data: { title: 'Site' } });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('reports a failure without refreshing', async () => {
    const result = await runAction(() => Promise.reject(new ApiNotFoundError('Project not found')), 'Saved');

    expect(result).toEqual({ ok: false, formError: 'Project not found' });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('toValidationFailure', () => {
  it('reports schema issues by field path', () => {
    const schema = z.object({ title: z.string().min(1, 'Required'), tags: z.array(z.string().max(2, 'Too long')) });
    const parsed = schema.safeParse({ title: '', tags: ['ok', 'too long'] });

    expect(parsed.success).toBe(false);
    expect(parsed.error && toValidationFailure(parsed.error)).toEqual({
      ok: false,
      fieldErrors: { title: 'Required', 'tags.1': 'Too long' },
    });
  });

  it('reports a problem with the whole input as a form error', () => {
    const parsed = z.object({ title: z.string() }).safeParse('not an object');

    expect(parsed.error && toValidationFailure(parsed.error)).toMatchObject({ ok: false, formError: expect.any(String) as string });
  });
});
