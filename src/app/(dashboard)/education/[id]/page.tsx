import { PageHeader } from '@/components/layout/page-header';
import { EducationForm } from '@/features/education/components/education-form';
import { getEducation } from '@/features/education/queries';
import { describeEducation, toEducationFormValues } from '@/features/education/schemas';
import { getMediaByIds } from '@/features/media/queries';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/education/[id]'>): Promise<Metadata> {
  return { title: describeEducation(await getEducation((await params).id)) };
}

export default async function EditEducationPage({ params }: PageProps<'/education/[id]'>) {
  const { id } = await params;
  const education = await getEducation(id);
  const knownMedia = await getMediaByIds([education.logo]);

  return (
    <>
      <PageHeader title={describeEducation(education)} />
      <EducationForm key={id} id={id} initialValues={toEducationFormValues(education)} knownMedia={knownMedia} />
    </>
  );
}
