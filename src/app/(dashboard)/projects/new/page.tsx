import { PageHeader } from '@/components/layout/page-header';
import { ProjectForm } from '@/features/projects/components/project-form';
import { EMPTY_PROJECT } from '@/features/projects/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New project' };

export default function NewProjectPage() {
  return (
    <>
      <PageHeader title="New project" />
      <ProjectForm initialValues={EMPTY_PROJECT} />
    </>
  );
}
