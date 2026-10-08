'use client';

import { GraduationCapIcon, PlusIcon } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { ItemRowActions } from '@/components/data-table/item-row-actions';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { deleteEducation, setEducationVisibility } from '@/features/education/actions';
import { describeEducation } from '@/features/education/schemas';
import { formatYearMonthRange } from '@/lib/utils/format-date';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { Education } from '@/features/education/schemas';
import type { ApiPage } from '@/lib/api/api-client';

const columns: DataTableColumn<Education>[] = [
  {
    id: 'degree',
    header: 'Degree',
    cell: (education) => (
      <span className="flex flex-col">
        <span className="font-medium">
          {education.degree}
          {education.field !== null && education.field !== undefined && `, ${education.field}`}
        </span>
        <span className="text-muted-foreground">{education.institution}</span>
      </span>
    ),
  },
  {
    id: 'dates',
    header: 'Dates',
    isSecondary: true,
    cell: (education) => formatYearMonthRange(education.startDate, education.endDate ?? null),
  },
  {
    id: 'visible',
    header: 'Show on portfolio',
    cell: (education) => (
      <VisibilityToggle
        isVisible={education.isVisible}
        itemLabel={describeEducation(education)}
        onChange={(isVisible) => setEducationVisibility(education.id, isVisible, describeEducation(education))}
      />
    ),
  },
];

export function EducationTable({ page }: { page: ApiPage<Education> }) {
  return (
    <div className="flex flex-col gap-4">
      <DataTable
        caption="Education"
        columns={columns}
        rows={page.items}
        getRowId={(education) => education.id}
        getRowLabel={describeEducation}
        emptyState={
          <EmptyState
            icon={GraduationCapIcon}
            title="No education yet"
            description="Degrees you add appear here, newest first, and in the Education section of the portfolio."
            action={
              <Button asChild>
                <GuardedLink href="/education/new">
                  <PlusIcon aria-hidden />
                  Add education
                </GuardedLink>
              </Button>
            }
          />
        }
        rowActions={(education) => (
          <ItemRowActions
            itemNoun="education"
            itemLabel={describeEducation(education)}
            editHref={`/education/${education.id}`}
            onDelete={() => deleteEducation(education.id, describeEducation(education))}
          />
        )}
      />
      <DataTablePagination pagination={page.pagination} itemNoun={{ singular: 'entry', plural: 'entries' }} />
    </div>
  );
}
