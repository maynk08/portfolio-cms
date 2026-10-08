'use client';

import { AwardIcon, PlusIcon } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { ItemRowActions } from '@/components/data-table/item-row-actions';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { StatusBadge } from '@/components/feedback/status-badge';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { deleteCertification, setCertificationVisibility } from '@/features/certifications/actions';
import { isExpired } from '@/features/certifications/schemas';
import { formatYearMonth } from '@/lib/utils/format-date';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { Certification } from '@/features/certifications/schemas';
import type { ApiPage } from '@/lib/api/api-client';

type CertificationTableProps = {
  page: ApiPage<Certification>;
  // `YYYY-MM`, decided by the page so the server and browser agree.
  currentMonth: string;
};

export function CertificationTable({ page, currentMonth }: CertificationTableProps) {
  const columns: DataTableColumn<Certification>[] = [
    {
      id: 'name',
      header: 'Certificate',
      cell: (certification) => (
        <span className="flex flex-col">
          <span className="font-medium">{certification.name}</span>
          <span className="text-muted-foreground">{certification.issuer}</span>
        </span>
      ),
    },
    { id: 'issued', header: 'Issued', isSecondary: true, cell: (certification) => formatYearMonth(certification.issueDate) },
    {
      id: 'expires',
      header: 'Expires',
      isSecondary: true,
      cell: (certification) =>
        certification.expiryDate === null || certification.expiryDate === undefined ? (
          <span className="text-muted-foreground">No expiry</span>
        ) : (
          <span className="flex items-center gap-2">
            {formatYearMonth(certification.expiryDate)}
            {isExpired(certification.expiryDate, currentMonth) && <StatusBadge status="expired" />}
          </span>
        ),
    },
    {
      id: 'visible',
      header: 'Show on portfolio',
      cell: (certification) => (
        <VisibilityToggle
          isVisible={certification.isVisible}
          itemLabel={certification.name}
          onChange={(isVisible) => setCertificationVisibility(certification.id, isVisible, certification.name)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        caption="Certifications"
        columns={columns}
        rows={page.items}
        getRowId={(certification) => certification.id}
        getRowLabel={(certification) => certification.name}
        emptyState={
          <EmptyState
            icon={AwardIcon}
            title="No certifications yet"
            description="Certificates you add appear here, newest first, and in the Certifications section of the portfolio."
            action={
              <Button asChild>
                <GuardedLink href="/certifications/new">
                  <PlusIcon aria-hidden />
                  Add certification
                </GuardedLink>
              </Button>
            }
          />
        }
        rowActions={(certification) => (
          <ItemRowActions
            itemNoun="certification"
            itemLabel={certification.name}
            editHref={`/certifications/${certification.id}`}
            onDelete={() => deleteCertification(certification.id, certification.name)}
          />
        )}
      />
      <DataTablePagination pagination={page.pagination} itemNoun={{ singular: 'certification', plural: 'certifications' }} />
    </div>
  );
}
