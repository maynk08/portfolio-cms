'use client';

import { CodeIcon, PlusIcon } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { ItemRowActions } from '@/components/data-table/item-row-actions';
import { useOptimisticOrder } from '@/components/data-table/use-optimistic-order';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { deleteSkillGroup, reorderSkillGroups, setSkillGroupVisibility } from '@/features/skills/actions';
import { describeSkillCount } from '@/features/skills/schemas';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { SkillGroup } from '@/features/skills/schemas';

export function SkillGroupTable({ groups }: { groups: SkillGroup[] }) {
  const { orderedRows, move, moveTo } = useOptimisticOrder(groups, (group) => group.id, reorderSkillGroups);

  const columns: DataTableColumn<SkillGroup>[] = [
    {
      id: 'position',
      header: 'Position',
      isSecondary: true,
      align: 'end',
      className: 'w-20',
      cell: (group) => orderedRows.indexOf(group) + 1,
    },
    { id: 'name', header: 'Group', cell: (group) => <span className="font-medium">{group.name}</span> },
    { id: 'skills', header: 'Skills', isSecondary: true, cell: describeSkillCount },
    {
      id: 'visible',
      header: 'Visible',
      cell: (group) => (
        <VisibilityToggle
          isVisible={group.isVisible}
          itemLabel={group.name}
          onChange={(isVisible) => setSkillGroupVisibility(group.id, isVisible, group.name)}
        />
      ),
    },
  ];

  return (
    <DataTable
      caption="Skill groups, in display order"
      columns={columns}
      rows={orderedRows}
      sorting={{ onMoveTo: moveTo }}
      getRowId={(group) => group.id}
      getRowLabel={(group) => group.name}
      emptyState={
        <EmptyState
          icon={CodeIcon}
          title="No skill groups yet"
          description="Groups such as “Frontend” or “Tools” hold your skills and appear in the Skills section of the portfolio."
          action={
            <Button asChild>
              <GuardedLink href="/skills/new">
                <PlusIcon aria-hidden />
                Add skill group
              </GuardedLink>
            </Button>
          }
        />
      }
      rowActions={(group) => {
        const index = orderedRows.indexOf(group);
        return (
          <ItemRowActions
            itemNoun="skill group"
            itemLabel={group.name}
            editHref={`/skills/${group.id}`}
            onDelete={() => deleteSkillGroup(group.id, group.name)}
            reorder={{
              isFirst: index === 0,
              isLast: index === orderedRows.length - 1,
              onMove: (offset) => {
                move(index, offset);
              },
            }}
          />
        );
      }}
    />
  );
}
