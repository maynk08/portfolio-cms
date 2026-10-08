import { PageHeader } from '@/components/layout/page-header';
import { SkillGroupForm } from '@/features/skills/components/skill-group-form';
import { getSkillGroup } from '@/features/skills/queries';
import { toSkillGroupFormValues } from '@/features/skills/schemas';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/skills/[id]'>): Promise<Metadata> {
  return { title: (await getSkillGroup((await params).id)).name };
}

export default async function EditSkillGroupPage({ params }: PageProps<'/skills/[id]'>) {
  const { id } = await params;
  const group = await getSkillGroup(id);

  return (
    <>
      <PageHeader title={group.name} />
      <SkillGroupForm key={id} id={id} initialValues={toSkillGroupFormValues(group)} />
    </>
  );
}
