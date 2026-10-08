'use client';

import { BriefcaseBusinessIcon, PlusIcon } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { ItemRowActions } from '@/components/data-table/item-row-actions';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { deleteExperience, setExperienceVisibility } from '@/features/experience/actions';
import { describeExperience } from '@/features/experience/schemas';
import { formatYearMonthRange } from '@/lib/utils/format-date';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { Experience } from '@/features/experience/schemas';
import type { ApiPage } from '@/lib/api/api-client';

const columns: DataTableColumn<Experience>[] = [
  {
    id: 'role',
    header: 'Role',
    cell: (experience) => (
      <span className="flex flex-col">
        <span className="font-medium">{experience.role}</span>
        <span className="text-muted-foreground">{experience.company}</span>
      </span>
    ),
  },
  {
    id: 'dates',
    header: 'Dates',
    isSecondary: true,
    cell: (experience) => formatYearMonthRange(experience.startDate, experience.endDate ?? null),
  },
  {
    id: 'visible',
    header: 'Show on portfolio',
    cell: (experience) => (
      <VisibilityToggle
        isVisible={experience.isVisible}
        itemLabel={describeExperience(experience)}
        onChange={(isVisible) => setExperienceVisibility(experience.id, isVisible, describeExperience(experience))}
      />
    ),
  },
];

export function ExperienceTable({ page }: { page: ApiPage<Experience> }) {
  return (
    <div className="flex flex-col gap-4">
      <DataTable
        caption="Experience"
        columns={columns}
        rows={page.items}
        getRowId={(experience) => experience.id}
        getRowLabel={describeExperience}
        emptyState={
          <EmptyState
            icon={BriefcaseBusinessIcon}
            title="No experience yet"
            description="Jobs you add appear here, newest first, and in the Experience section of the portfolio."
            action={
              <Button asChild>
                <GuardedLink href="/experience/new">
                  <PlusIcon aria-hidden />
                  Add experience
                </GuardedLink>
              </Button>
            }
          />
        }
        rowActions={(experience) => (
          <ItemRowActions
            itemNoun="experience"
            itemLabel={describeExperience(experience)}
            editHref={`/experience/${experience.id}`}
            onDelete={() => deleteExperience(experience.id, describeExperience(experience))}
          />
        )}
      />
      <DataTablePagination pagination={page.pagination} itemNoun={{ singular: 'job', plural: 'jobs' }} />
    </div>
  );
}
