import { PageHeader } from '@/components/layout/page-header';
import { ProjectForm } from '@/features/projects/components/project-form';
import { getProject } from '@/features/projects/queries';
import { toProjectFormValues } from '@/features/projects/schemas';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/projects/[id]'>): Promise<Metadata> {
  return { title: (await getProject((await params).id)).title };
}

export default async function EditProjectPage({ params }: PageProps<'/projects/[id]'>) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <>
      <PageHeader title={project.title} />
      <ProjectForm key={id} id={id} initialValues={toProjectFormValues(project)} />
    </>
  );
}
