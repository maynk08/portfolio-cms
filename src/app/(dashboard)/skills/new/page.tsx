import { PageHeader } from '@/components/layout/page-header';
import { SkillGroupForm } from '@/features/skills/components/skill-group-form';
import { EMPTY_SKILL_GROUP } from '@/features/skills/schemas';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New skill group' };

export default function NewSkillGroupPage() {
  return (
    <>
      <PageHeader title="New skill group" />
      <SkillGroupForm initialValues={EMPTY_SKILL_GROUP} />
    </>
  );
}
