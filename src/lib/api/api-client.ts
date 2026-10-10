import 'server-only';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { env } from '@/config/env';
import { loginPathFor } from '@/lib/session/login-paths';
import { getSessionToken } from '@/lib/session/session-token';

import {
  ApiConflictError,
  ApiError,
  ApiNotFoundError,
  ApiRateLimitError,
  ApiResponseError,
  ApiUnauthorizedError,
  ApiUnavailableError,
  ApiValidationError,
} from './api-errors';

const ADMIN_API_PREFIX = '/api/admin';
const REQUEST_TIMEOUT_MS = 10_000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  // Added to the URL; `null` and `undefined` values are left out.
  query?: Record<string, QueryValue>;
  // Sends the session token. A rejected or missing session redirects to the login page.
  isAuthenticated?: boolean;
  // When false, an authenticated call throws `ApiUnauthorizedError` instead of redirecting (the login page needs this).
  shouldRedirectOnUnauthorized?: boolean;
  headers?: Record<string, string>;
}

export interface ApiRequestOptions<T> extends RequestOptions {
  // Validates the response's `data`; the backend is trusted to be up, not to be right.
  schema: z.ZodType<T>;
}

export interface ApiPageOptions<T> extends Omit<RequestOptions, 'method' | 'body'> {
  // Validates each item of the page.
  itemSchema: z.ZodType<T>;
}

export const paginationSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export interface ApiPage<T> {
  items: T[];
  pagination: Pagination;
}

// The backend's largest page; used to load complete lists.
const MAX_PAGE_SIZE = 100;

const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  details: z.unknown().optional(),
});

const successEnvelopeSchema = z.object({ success: z.literal(true), data: z.unknown() });

const paginatedEnvelopeSchema = z.object({ success: z.literal(true), data: z.array(z.unknown()), pagination: paginationSchema });

function parseRetryAfter(value: string | null): number | null {
  const seconds = Number(value);
  return value !== null && Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function toApiError(response: Response, body: unknown): ApiError {
  const envelope = errorEnvelopeSchema.safeParse(body);
  if (!envelope.success) {
    return new ApiResponseError(response.status, `Unexpected error response (HTTP ${response.status})`);
  }
  const { message, errors, details } = envelope.data;

  switch (response.status) {
    case 401:
      return new ApiUnauthorizedError(message);
    case 404:
      return new ApiNotFoundError(message);
    case 409:
      return new ApiConflictError(message, details);
    case 422:
      return new ApiValidationError(message, errors ?? []);
    case 429:
      return new ApiRateLimitError(message, parseRetryAfter(response.headers.get('Retry-After')));
    case 503:
      return new ApiUnavailableError(message, { isReportedByBackend: true });
    default:
      return new ApiError(response.status, message);
  }
}

async function sendRequest(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    // Connection refused, DNS failure or timeout: all mean the admin should check the backend and retry.
    throw new ApiUnavailableError('The server could not be reached', { cause: error });
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new ApiResponseError(response.status, `Response is not JSON (HTTP ${response.status})`, { cause: error });
  }
}

function buildUrl(path: string, query: RequestOptions['query']): string {
  const url = new URL(`${env.backendUrl}${ADMIN_API_PREFIX}${path}`);
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(name, String(value));
    }
  }
  return url.toString();
}

// Sends the request and returns the parsed body of a successful response; every failure becomes a typed error.
async function requestJson(path: string, options: RequestOptions): Promise<{ body: unknown; status: number }> {
  const { method = 'GET', body, query, isAuthenticated = true, shouldRedirectOnUnauthorized = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json', 'X-Request-Id': crypto.randomUUID(), ...options.headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (isAuthenticated) {
    const token = await getSessionToken();
    if (token === null) {
      if (shouldRedirectOnUnauthorized) {
        redirect(loginPathFor('expired'));
      }
      throw new ApiUnauthorizedError('Not logged in');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await sendRequest(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseBody = await readJson(response);

  if (!response.ok) {
    const error = toApiError(response, responseBody);
    if (error instanceof ApiUnauthorizedError && isAuthenticated && shouldRedirectOnUnauthorized) {
      redirect(loginPathFor('expired'));
    }
    throw error;
  }
  return { body: responseBody, status: response.status };
}

/**
 * The only way the CMS talks to the backend. Runs on the server, sends the session token as a bearer token,
 * never caches, and turns failures into typed errors.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions<T>): Promise<T> {
  const { body, status } = await requestJson(path, options);

  const envelope = successEnvelopeSchema.safeParse(body);
  const data = envelope.success ? options.schema.safeParse(envelope.data.data) : null;
  if (data?.success !== true) {
    throw new ApiResponseError(status, `Unexpected response from ${options.method ?? 'GET'} ${path}`, { cause: data?.error });
  }
  return data.data;
}

// One page of a paginated list, with the pagination details.
export async function apiRequestPage<T>(path: string, options: ApiPageOptions<T>): Promise<ApiPage<T>> {
  const { body, status } = await requestJson(path, options);

  const envelope = paginatedEnvelopeSchema.safeParse(body);
  const items = envelope.success ? z.array(options.itemSchema).safeParse(envelope.data.data) : null;
  if (!envelope.success || items?.success !== true) {
    throw new ApiResponseError(status, `Unexpected response from GET ${path}`, { cause: items?.error ?? envelope.error });
  }
  return { items: items.data, pagination: envelope.data.pagination };
}

// Every item of a paginated list, for lists that are shown whole (manually ordered ones).
export async function apiRequestAll<T>(path: string, options: ApiPageOptions<T>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await apiRequestPage(path, { ...options, query: { ...options.query, page, pageSize: MAX_PAGE_SIZE } });
    items.push(...result.items);
    if (page >= result.pagination.totalPages) {
      return items;
    }
  }
}
