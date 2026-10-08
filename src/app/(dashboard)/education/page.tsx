import { ListPageHeader } from '@/components/data-table/list-page-header';
import { EducationTable } from '@/features/education/components/education-table';
import { getEducationPage } from '@/features/education/queries';
import { parseListParams } from '@/lib/utils/list-params';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Education' };

export default async function EducationPage({ searchParams }: PageProps<'/education'>) {
  const query = await searchParams;
  const page = await getEducationPage({ params: parseListParams(query), pathname: '/education', searchParams: query });

  return (
    <>
      <ListPageHeader
        title="Education"
        description="Your degrees, newest first; ongoing ones on top."
        addLabel="Add education"
        addHref="/education/new"
      />
      <EducationTable page={page} />
    </>
  );
}
