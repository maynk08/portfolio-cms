import { ListPageHeader } from '@/components/data-table/list-page-header';
import { ProjectTable } from '@/features/projects/components/project-table';
import { listProjects } from '@/features/projects/queries';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <>
      <ListPageHeader
        title="Projects"
        description="Shown on the portfolio in this order; featured ones also appear on the home page."
        addLabel="Add project"
        addHref="/projects/new"
      />
      <ProjectTable projects={projects} />
    </>
  );
}
