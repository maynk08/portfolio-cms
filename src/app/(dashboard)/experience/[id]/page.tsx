import { PageHeader } from '@/components/layout/page-header';
import { ExperienceForm } from '@/features/experience/components/experience-form';
import { getExperience } from '@/features/experience/queries';
import { describeExperience, toExperienceFormValues } from '@/features/experience/schemas';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/experience/[id]'>): Promise<Metadata> {
  return { title: describeExperience(await getExperience((await params).id)) };
}

export default async function EditExperiencePage({ params }: PageProps<'/experience/[id]'>) {
  const { id } = await params;
  const experience = await getExperience(id);

  return (
    <>
      <PageHeader title={describeExperience(experience)} />
      <ExperienceForm key={id} id={id} initialValues={toExperienceFormValues(experience)} />
    </>
  );
}
