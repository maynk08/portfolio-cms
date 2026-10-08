import { ListPageHeader } from '@/components/data-table/list-page-header';
import { ExperienceTable } from '@/features/experience/components/experience-table';
import { getExperiencePage } from '@/features/experience/queries';
import { parseListParams } from '@/lib/utils/list-params';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Experience' };

export default async function ExperiencePage({ searchParams }: PageProps<'/experience'>) {
  const query = await searchParams;
  const page = await getExperiencePage({ params: parseListParams(query), pathname: '/experience', searchParams: query });

  return (
    <>
      <ListPageHeader
        title="Experience"
        description="Your jobs, newest first; current ones on top."
        addLabel="Add experience"
        addHref="/experience/new"
      />
      <ExperienceTable page={page} />
    </>
  );
}
