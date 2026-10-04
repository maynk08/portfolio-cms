import {
  AwardIcon,
  BriefcaseBusinessIcon,
  CodeIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  ImagesIcon,
  InboxIcon,
  LayoutDashboardIcon,
  PanelsTopLeftIcon,
  SettingsIcon,
  UserRoundIcon,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const DASHBOARD_PATH = '/';

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ title: 'Dashboard', href: DASHBOARD_PATH, icon: LayoutDashboardIcon }] },
  {
    label: 'Content',
    items: [
      { title: 'Profile', href: '/profile', icon: UserRoundIcon },
      { title: 'Sections', href: '/sections', icon: PanelsTopLeftIcon },
      { title: 'Experience', href: '/experience', icon: BriefcaseBusinessIcon },
      { title: 'Projects', href: '/projects', icon: FolderGit2Icon },
      { title: 'Skills', href: '/skills', icon: CodeIcon },
      { title: 'Education', href: '/education', icon: GraduationCapIcon },
      { title: 'Certifications', href: '/certifications', icon: AwardIcon },
    ],
  },
  { label: 'Library', items: [{ title: 'Media', href: '/media', icon: ImagesIcon }] },
  { label: 'Inbox', items: [{ title: 'Messages', href: '/messages', icon: InboxIcon }] },
  { label: null, items: [{ title: 'Settings', href: '/settings', icon: SettingsIcon }] },
];

export interface NavLocation {
  group: NavGroup;
  item: NavItem;
}

// The nav entry a path belongs to: `/projects/abc` belongs to Projects. Only `/` itself is the dashboard.
export function findNavLocation(pathname: string): NavLocation | null {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((candidate) =>
      candidate.href === DASHBOARD_PATH
        ? pathname === DASHBOARD_PATH
        : pathname === candidate.href || pathname.startsWith(`${candidate.href}/`),
    );
    if (item !== undefined) {
      return { group, item };
    }
  }
  return null;
}
