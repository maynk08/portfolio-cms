import { PageHeader } from '@/components/layout/page-header';
import { SectionsTable } from '@/features/sections/components/sections-table';
import { listSections } from '@/features/sections/queries';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sections' };

export default async function SectionsPage() {
  const sections = await listSections();

  return (
    <>
      <PageHeader
        title="Sections"
        description="Rename the sections of the portfolio or hide them. Hidden sections also leave the navigation. Changing the order comes in a later update."
      />
      <SectionsTable sections={sections} />
    </>
  );
}
