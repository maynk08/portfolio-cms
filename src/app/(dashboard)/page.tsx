import { PageHeader } from '@/components/layout/page-header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentAdmin } from '@/features/auth/session';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();

  return (
    <>
      <PageHeader title="Dashboard" description={`Logged in as ${admin.email}.`} />
      <Card>
        <CardHeader>
          <CardTitle>Overview coming soon</CardTitle>
          <CardDescription>Unread messages and content totals will appear here.</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
