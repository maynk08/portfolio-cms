import { PageHeader } from '@/components/layout/page-header';
import { EducationForm } from '@/features/education/components/education-form';
import { EMPTY_EDUCATION } from '@/features/education/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New education' };

export default function NewEducationPage() {
  return (
    <>
      <PageHeader title="New education" />
      <EducationForm initialValues={EMPTY_EDUCATION} knownMedia={{}} />
    </>
  );
}
