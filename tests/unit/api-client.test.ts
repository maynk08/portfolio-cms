import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { apiRequest, apiRequestAll, apiRequestPage } from '@/lib/api/api-client';
import {
  ApiConflictError,
  ApiError,
  ApiNotFoundError,
  ApiRateLimitError,
  ApiResponseError,
  ApiUnauthorizedError,
  ApiUnavailableError,
  ApiValidationError,
} from '@/lib/api/api-errors';

const { cookieStore, RedirectSignal } = vi.hoisted(() => {
  // Stands in for Next.js's redirect, which also works by throwing.
  class RedirectSignal extends Error {
    constructor(readonly url: string) {
      super(`Redirect to ${url}`);
    }
  }
  return { cookieStore: { get: vi.fn<(name: string) => { value: string } | undefined>() }, RedirectSignal };
});

vi.mock('next/headers', () => ({ cookies: () => Promise.resolve(cookieStore) }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

const itemSchema = z.object({ id: z.string() });

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function errorResponse(status: number, message: string, extra: object = {}, headers: Record<string, string> = {}): Response {
  return jsonResponse(status, { success: false, message, ...extra }, headers);
}

function lastRequest(): { url: string; init: RequestInit; headers: Record<string, string> } {
  const [url, init] = fetchMock.mock.lastCall ?? [];
  return {
    url: url instanceof Request ? url.url : (url?.toString() ?? ''),
    init: init ?? {},
    headers: (init?.headers ?? {}) as Record<string, string>,
  };
}

async function expectRejection<T extends Error>(promise: Promise<unknown>, errorClass: new (...args: never[]) => T): Promise<T> {
  const error: unknown = await promise.then(
    () => null,
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(errorClass);
  return error as T;
}

beforeEach(() => {
  fetchMock.mockReset();
  cookieStore.get.mockReset();
  cookieStore.get.mockReturnValue({ value: 'session-token' });
});

describe('apiRequest', () => {
  it('calls the admin API with the session token and returns the validated data', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: { id: 'a1', extra: true } }));

    const data = await apiRequest('/projects/a1', { schema: itemSchema });

    expect(data).toEqual({ id: 'a1' });
    const { url, init, headers } = lastRequest();
    expect(url).toBe('http://backend.test/api/admin/projects/a1');
    expect(init).toMatchObject({ method: 'GET', cache: 'no-store' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(headers).toMatchObject({ Authorization: 'Bearer session-token', Accept: 'application/json' });
    expect(headers['X-Request-Id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(cookieStore.get).toHaveBeenCalledWith('cms_session');
  });

  it('sends a JSON body and extra headers, without a token for public calls', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: null }));

    await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c' },
      schema: z.null(),
      isAuthenticated: false,
      headers: { 'X-Forwarded-For': '10.0.0.1' },
    });

    const { init, headers } = lastRequest();
    expect(init.body).toBe('{"email":"a@b.c"}');
    expect(headers).toMatchObject({ 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.1' });
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('redirects to the login page without calling the backend when there is no session', async () => {
    cookieStore.get.mockReturnValue(undefined);

    const signal = await expectRejection(apiRequest('/auth/me', { schema: itemSchema }), RedirectSignal);

    expect(signal.url).toBe('/login?reason=expired');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws instead of redirecting when asked to, for the login page', async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expectRejection(apiRequest('/auth/me', { schema: itemSchema, shouldRedirectOnUnauthorized: false }), ApiUnauthorizedError);
  });

  it('redirects to the login page when the backend rejects the session', async () => {
    fetchMock.mockResolvedValue(errorResponse(401, 'Session has ended, please log in again'));

    const signal = await expectRejection(apiRequest('/profile', { schema: itemSchema }), RedirectSignal);

    expect(signal.url).toBe('/login?reason=expired');
  });

  it('throws a 401 from an unauthenticated call, such as wrong login details', async () => {
    fetchMock.mockResolvedValue(errorResponse(401, 'Invalid email or password'));

    const error = await expectRejection(
      apiRequest('/auth/login', { method: 'POST', schema: itemSchema, isAuthenticated: false }),
      ApiUnauthorizedError,
    );

    expect(error.message).toBe('Invalid email or password');
  });

  it('turns 422 into a validation error with the field errors', async () => {
    const errors = [{ field: 'title', message: 'Required' }];
    fetchMock.mockResolvedValue(errorResponse(422, 'Validation failed', { errors }));

    const error = await expectRejection(apiRequest('/projects', { method: 'POST', schema: itemSchema }), ApiValidationError);

    expect(error.fieldErrors).toEqual(errors);
  });

  it('keeps the details of a conflict', async () => {
    const details = { usages: [{ resource: 'project', id: 'p1' }] };
    fetchMock.mockResolvedValue(errorResponse(409, 'This file is in use', { details }));

    const error = await expectRejection(apiRequest('/media/m1', { method: 'DELETE', schema: z.null() }), ApiConflictError);

    expect(error.details).toEqual(details);
  });

  it('reads Retry-After from a rate limit response', async () => {
    fetchMock.mockResolvedValue(errorResponse(429, 'Too many requests', {}, { 'Retry-After': '900' }));

    const error = await expectRejection(apiRequest('/auth/login', { schema: itemSchema, isAuthenticated: false }), ApiRateLimitError);

    expect(error.retryAfterSeconds).toBe(900);
  });

  it.each([
    [404, ApiNotFoundError],
    [503, ApiUnavailableError],
  ])('maps HTTP %s to its error class', async (status, errorClass) => {
    fetchMock.mockResolvedValue(errorResponse(status, 'Backend message'));

    const error = await expectRejection(apiRequest('/projects/x', { schema: itemSchema }), errorClass);

    expect(error.message).toBe('Backend message');
  });

  it('keeps the status of any other error', async () => {
    fetchMock.mockResolvedValue(errorResponse(500, 'Internal server error'));

    const error = await expectRejection(apiRequest('/projects', { schema: itemSchema }), ApiError);

    expect(error.status).toBe(500);
  });

  it.each([
    ['refuses the connection', new TypeError('fetch failed')],
    ['times out', new DOMException('The operation timed out', 'TimeoutError')],
  ])('reports the backend as unavailable when it %s', async (_case, failure) => {
    fetchMock.mockRejectedValue(failure);

    const error = await expectRejection(apiRequest('/projects', { schema: itemSchema }), ApiUnavailableError);

    expect(error.cause).toBe(failure);
  });

  it('rejects a response that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expectRejection(apiRequest('/projects', { schema: itemSchema }), ApiResponseError);
  });

  it('rejects data that does not match the schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: { id: 42 } }));

    await expectRejection(apiRequest('/projects/a1', { schema: itemSchema }), ApiResponseError);
  });

  it('rejects an error response without the standard envelope', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'boom' }));

    const error = await expectRejection(apiRequest('/projects', { schema: itemSchema }), ApiResponseError);

    expect(error.status).toBe(500);
  });

  it('adds query values to the URL, leaving out empty ones', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: null }));

    await apiRequest('/messages', { schema: z.null(), query: { status: 'unread', page: 2, kind: undefined, search: null } });

    expect(lastRequest().url).toBe('http://backend.test/api/admin/messages?status=unread&page=2');
  });
});

describe('apiRequestPage', () => {
  const pagination = { page: 2, pageSize: 20, totalItems: 41, totalPages: 3 };

  it('returns validated items with the pagination details', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: [{ id: 'a' }, { id: 'b' }], pagination }));

    const page = await apiRequestPage('/experiences', { itemSchema, query: { page: 2 } });

    expect(page).toEqual({ items: [{ id: 'a' }, { id: 'b' }], pagination });
  });

  it('rejects a response without pagination or with a bad item', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: [{ id: 'a' }] }));
    await expectRejection(apiRequestPage('/experiences', { itemSchema }), ApiResponseError);

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: [{ id: 1 }], pagination }));
    await expectRejection(apiRequestPage('/experiences', { itemSchema }), ApiResponseError);
  });
});

describe('apiRequestAll', () => {
  it('loads every page at the largest page size', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { success: true, data: [{ id: 'a' }], pagination: { page: 1, pageSize: 100, totalItems: 2, totalPages: 2 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { success: true, data: [{ id: 'b' }], pagination: { page: 2, pageSize: 100, totalItems: 2, totalPages: 2 } }),
      );

    const items = await apiRequestAll('/projects', { itemSchema });

    expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(fetchMock.mock.calls.map(([url]) => (url instanceof Request ? url.url : url.toString()))).toEqual([
      'http://backend.test/api/admin/projects?page=1&pageSize=100',
      'http://backend.test/api/admin/projects?page=2&pageSize=100',
    ]);
  });

  it('makes one request for an empty list', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, data: [], pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } }),
    );

    expect(await apiRequestAll('/projects', { itemSchema })).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
