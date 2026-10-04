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

export interface ApiRequestOptions<T> {
  method?: HttpMethod;
  body?: unknown;
  // Validates the response's `data`; the backend is trusted to be up, not to be right.
  schema: z.ZodType<T>;
  // Sends the session token. A rejected or missing session redirects to the login page.
  isAuthenticated?: boolean;
  // When false, an authenticated call throws `ApiUnauthorizedError` instead of redirecting (the login page needs this).
  shouldRedirectOnUnauthorized?: boolean;
  headers?: Record<string, string>;
}

const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  details: z.unknown().optional(),
});

const successEnvelopeSchema = z.object({ success: z.literal(true), data: z.unknown() });

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
      return new ApiUnavailableError(message);
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

/**
 * The only way the CMS talks to the backend. Runs on the server, sends the session token as a bearer token,
 * never caches, and turns failures into typed errors.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions<T>): Promise<T> {
  const { method = 'GET', body, schema, isAuthenticated = true, shouldRedirectOnUnauthorized = true } = options;

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

  const response = await sendRequest(`${env.backendUrl}${ADMIN_API_PREFIX}${path}`, {
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

  const envelope = successEnvelopeSchema.safeParse(responseBody);
  const data = envelope.success ? schema.safeParse(envelope.data.data) : null;
  if (data?.success !== true) {
    throw new ApiResponseError(response.status, `Unexpected response from ${method} ${path}`, { cause: data?.error });
  }
  return data.data;
}
