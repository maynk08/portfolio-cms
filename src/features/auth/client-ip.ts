import 'server-only';

import { isIP } from 'node:net';

import { headers } from 'next/headers';

/**
 * The visitor's IP for the backend's per-IP login limit. Next.js fills `X-Forwarded-For` from the connection only
 * when the request did not bring its own, so until a trusted proxy overwrites it the value can be spoofed.
 */
export async function getClientIp(): Promise<string | null> {
  const forwardedFor = (await headers()).get('x-forwarded-for');
  const firstAddress = forwardedFor?.split(',')[0]?.trim() ?? '';
  return isIP(firstAddress) === 0 ? null : firstAddress;
}
