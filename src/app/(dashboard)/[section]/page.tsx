import { notFound } from 'next/navigation';

import { DASHBOARD_PATH, findNavLocation } from '@/components/layout/nav-items';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentAdmin } from '@/features/auth/session';

import type { NavItem } from '@/components/layout/nav-items';
import type { Metadata } from 'next';

// Placeholder for sidebar pages that are not built yet; each real page takes over its own route.
function findSectionItem(section: string): NavItem {
  const location = findNavLocation(`/${section}`);
  if (location === null || location.item.href === DASHBOARD_PATH || location.item.href !== `/${section}`) {
    notFound();
  }
  return location.item;
}

export async function generateMetadata({ params }: PageProps<'/[section]'>): Promise<Metadata> {
  return { title: findSectionItem((await params).section).title };
}

export default async function ComingSoonPage({ params }: PageProps<'/[section]'>) {
  const item = findSectionItem((await params).section);
  await getCurrentAdmin();

  return (
    <>
      <PageHeader title={item.title} />
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>This page is not built yet.</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
