import 'server-only';

import { z } from 'zod';

import { apiRequest } from '@/lib/api/api-client';

import { sectionSchema } from './schemas';

import type { Section } from './schemas';

// In display order.
export function listSections(): Promise<Section[]> {
  return apiRequest('/sections', { schema: z.array(sectionSchema) });
}
