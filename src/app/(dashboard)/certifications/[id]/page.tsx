import { PageHeader } from '@/components/layout/page-header';
import { CertificationForm } from '@/features/certifications/components/certification-form';
import { getCertification } from '@/features/certifications/queries';
import { toCertificationFormValues } from '@/features/certifications/schemas';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/certifications/[id]'>): Promise<Metadata> {
  return { title: (await getCertification((await params).id)).name };
}

export default async function EditCertificationPage({ params }: PageProps<'/certifications/[id]'>) {
  const { id } = await params;
  const certification = await getCertification(id);

  return (
    <>
      <PageHeader title={certification.name} />
      <CertificationForm key={id} id={id} initialValues={toCertificationFormValues(certification)} />
    </>
  );
}
