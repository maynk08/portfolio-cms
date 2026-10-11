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
        description="Rename the sections of the portfolio, hide them, or change their order: drag a row by its handle, or use Move up / Move down in its menu. Hidden sections also leave the navigation."
      />
      <SectionsTable sections={sections} />
    </>
  );
}
