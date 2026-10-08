import { ListPageHeader } from '@/components/data-table/list-page-header';
import { CertificationTable } from '@/features/certifications/components/certification-table';
import { getCertificationPage } from '@/features/certifications/queries';
import { currentYearMonth } from '@/lib/utils/format-date';
import { parseListParams } from '@/lib/utils/list-params';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Certifications' };

export default async function CertificationsPage({ searchParams }: PageProps<'/certifications'>) {
  const query = await searchParams;
  const page = await getCertificationPage({ params: parseListParams(query), pathname: '/certifications', searchParams: query });

  return (
    <>
      <ListPageHeader
        title="Certifications"
        description="Your certificates, newest first. Expired ones stay on the portfolio, marked as expired."
        addLabel="Add certification"
        addHref="/certifications/new"
      />
      <CertificationTable page={page} currentMonth={currentYearMonth()} />
    </>
  );
}
