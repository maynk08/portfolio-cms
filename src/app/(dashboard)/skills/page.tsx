import { ListPageHeader } from '@/components/data-table/list-page-header';
import { SkillGroupTable } from '@/features/skills/components/skill-group-table';
import { listSkillGroups } from '@/features/skills/queries';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Skills' };

export default async function SkillsPage() {
  const groups = await listSkillGroups();

  return (
    <>
      <ListPageHeader
        title="Skills"
        description="Skill groups, shown on the portfolio in this order."
        addLabel="Add skill group"
        addHref="/skills/new"
      />
      <SkillGroupTable groups={groups} />
    </>
  );
}
