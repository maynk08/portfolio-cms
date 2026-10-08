import { ArchiveIcon, CalendarXIcon, EyeIcon, EyeOffIcon, MailIcon, MailOpenIcon, StarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import type { LucideIcon } from 'lucide-react';

export type Status = 'visible' | 'hidden' | 'featured' | 'unread' | 'read' | 'archived' | 'expired';

// One vocabulary for every status in the CMS; each has text and an icon, never colour alone.
const STATUSES: Record<Status, { label: string; icon: LucideIcon; variant: 'default' | 'secondary' | 'outline' }> = {
  visible: { label: 'Visible', icon: EyeIcon, variant: 'secondary' },
  hidden: { label: 'Hidden', icon: EyeOffIcon, variant: 'outline' },
  featured: { label: 'Featured', icon: StarIcon, variant: 'default' },
  unread: { label: 'Unread', icon: MailIcon, variant: 'default' },
  read: { label: 'Read', icon: MailOpenIcon, variant: 'secondary' },
  archived: { label: 'Archived', icon: ArchiveIcon, variant: 'outline' },
  expired: { label: 'Expired', icon: CalendarXIcon, variant: 'outline' },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, icon: Icon, variant } = STATUSES[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}
