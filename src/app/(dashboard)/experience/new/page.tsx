import { PageHeader } from '@/components/layout/page-header';
import { ExperienceForm } from '@/features/experience/components/experience-form';
import { EMPTY_EXPERIENCE } from '@/features/experience/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New experience' };

export default function NewExperiencePage() {
  return (
    <>
      <PageHeader title="New experience" />
      <ExperienceForm initialValues={EMPTY_EXPERIENCE} knownMedia={{}} />
    </>
  );
}
