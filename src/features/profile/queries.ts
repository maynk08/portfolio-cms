import 'server-only';

import { apiRequest } from '@/lib/api/api-client';

import { profileResponseSchema } from './schemas';

import type { ProfileResponse } from './schemas';

export function getProfile(): Promise<ProfileResponse> {
  return apiRequest('/profile', { schema: profileResponseSchema });
}
