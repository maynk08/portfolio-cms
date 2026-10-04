import 'server-only';

import { apiRequest } from '@/lib/api/api-client';

import { settingsSchema } from './schemas';

import type { SettingsValues } from './schemas';

export function getSettings(): Promise<SettingsValues> {
  return apiRequest('/settings', { schema: settingsSchema });
}
