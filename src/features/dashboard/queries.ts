import 'server-only';

import { z } from 'zod';

import { getLatestUnreadMessages, getMessageCounts } from '@/features/messages/queries';
import { listProjects } from '@/features/projects/queries';
import { listSections } from '@/features/sections/queries';
import { apiRequestPage } from '@/lib/api/api-client';

import type { Message, MessageCounts } from '@/features/messages/schemas';

export interface DashboardSummary {
  messageCounts: MessageCounts;
  latestUnread: Message[];
  totals: {
    experience: number;
    projects: number;
    featuredProjects: number;
    skillGroups: number;
    education: number;
    certifications: number;
    media: number;
  };
  sections: { total: number; hidden: number };
}

const LATEST_UNREAD_COUNT = 5;

// The size of a list, read from its first page; no item data is needed.
async function countItems(path: string): Promise<number> {
  const page = await apiRequestPage(path, { itemSchema: z.unknown(), query: { page: 1, pageSize: 1 } });
  return page.pagination.totalItems;
}

// Everything the dashboard shows, loaded in parallel.
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [messageCounts, latestUnread, experience, skillGroups, education, certifications, media, projects, sections] = await Promise.all([
    getMessageCounts(),
    getLatestUnreadMessages(LATEST_UNREAD_COUNT),
    countItems('/experiences'),
    countItems('/skill-groups'),
    countItems('/education'),
    countItems('/certifications'),
    countItems('/media'),
    listProjects(),
    listSections(),
  ]);

  return {
    messageCounts,
    latestUnread: latestUnread.items,
    totals: {
      experience,
      projects: projects.length,
      featuredProjects: projects.filter((project) => project.isFeatured).length,
      skillGroups,
      education,
      certifications,
      media,
    },
    sections: { total: sections.length, hidden: sections.filter((section) => !section.isVisible).length },
  };
}
