import {
  AwardIcon,
  BriefcaseBusinessIcon,
  CodeIcon,
  ExternalLinkIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  ImagesIcon,
  InboxIcon,
  PanelsTopLeftIcon,
  PlusIcon,
  UploadIcon,
  UserRoundIcon,
} from 'lucide-react';

import { Timestamp } from '@/components/feedback/timestamp';
import { PageHeader } from '@/components/layout/page-header';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { env } from '@/config/env';
import { getCurrentAdmin } from '@/features/auth/session';
import { ContentCard } from '@/features/dashboard/components/content-card';
import { getDashboardSummary } from '@/features/dashboard/queries';
import { MessageLink } from '@/features/messages/components/message-link';
import { messagePreview } from '@/features/messages/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count.toLocaleString('en')} ${count === 1 ? singular : pluralForm}`;
}

export default async function DashboardPage() {
  const [admin, summary] = await Promise.all([getCurrentAdmin(), getDashboardSummary()]);
  const { messageCounts, latestUnread, totals, sections } = summary;

  return (
    <>
      <PageHeader title="Dashboard" description={`Logged in as ${admin.email}.`} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <GuardedLink href="/profile">
            <UserRoundIcon aria-hidden />
            Edit profile
          </GuardedLink>
        </Button>
        <Button variant="outline" asChild>
          <GuardedLink href="/projects/new">
            <PlusIcon aria-hidden />
            Add project
          </GuardedLink>
        </Button>
        <Button variant="outline" asChild>
          <GuardedLink href="/media">
            <UploadIcon aria-hidden />
            Upload files
          </GuardedLink>
        </Button>
        <Button variant="outline" asChild>
          <a href={env.portfolioUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon aria-hidden />
            View portfolio
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <InboxIcon aria-hidden className="size-4" />
              {messageCounts.unread === 0 ? 'No unread messages' : plural(messageCounts.unread, 'unread message')}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {latestUnread.length > 0 && (
            <ul aria-label="Newest unread messages" className="flex flex-col divide-y">
              {latestUnread.map((message) => (
                <li key={message.id}>
                  <MessageLink
                    message={message}
                    href={`/messages?message=${message.id}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm py-2 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-medium">{message.name}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{messagePreview(message)}</span>
                    <span className="text-sm text-muted-foreground">
                      <Timestamp value={message.createdAt} />
                    </span>
                  </MessageLink>
                </li>
              ))}
            </ul>
          )}
          <GuardedLink href="/messages" className="w-fit text-sm underline underline-offset-4">
            Open the inbox
          </GuardedLink>
        </CardContent>
      </Card>

      <section aria-labelledby="content-heading" className="flex flex-col gap-3">
        <h2 id="content-heading" className="text-lg font-semibold">
          Content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ContentCard
            href="/projects"
            icon={FolderGit2Icon}
            title="Projects"
            value={totals.projects.toLocaleString('en')}
            detail={`${totals.featuredProjects} featured`}
          />
          <ContentCard
            href="/experience"
            icon={BriefcaseBusinessIcon}
            title="Experience"
            value={totals.experience.toLocaleString('en')}
            detail={plural(totals.experience, 'job')}
          />
          <ContentCard
            href="/skills"
            icon={CodeIcon}
            title="Skills"
            value={totals.skillGroups.toLocaleString('en')}
            detail={plural(totals.skillGroups, 'group')}
          />
          <ContentCard
            href="/education"
            icon={GraduationCapIcon}
            title="Education"
            value={totals.education.toLocaleString('en')}
            detail={plural(totals.education, 'entry', 'entries')}
          />
          <ContentCard href="/certifications" icon={AwardIcon} title="Certifications" value={totals.certifications.toLocaleString('en')} />
          <ContentCard
            href="/media"
            icon={ImagesIcon}
            title="Media"
            value={totals.media.toLocaleString('en')}
            detail={plural(totals.media, 'file')}
          />
          <ContentCard
            href="/sections"
            icon={PanelsTopLeftIcon}
            title="Sections"
            value={`${sections.total - sections.hidden} of ${sections.total}`}
            detail={sections.hidden === 0 ? 'All shown' : `${sections.hidden} hidden`}
          />
        </div>
      </section>
    </>
  );
}
