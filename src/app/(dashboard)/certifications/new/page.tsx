import { PageHeader } from '@/components/layout/page-header';
import { CertificationForm } from '@/features/certifications/components/certification-form';
import { EMPTY_CERTIFICATION } from '@/features/certifications/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New certification' };

export default function NewCertificationPage() {
  return (
    <>
      <PageHeader title="New certification" />
      <CertificationForm initialValues={EMPTY_CERTIFICATION} knownMedia={{}} />
    </>
  );
}
