'use client';

import { PanelsTopLeftIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { RowActions } from '@/components/data-table/row-actions';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { setSectionVisibility } from '@/features/sections/actions';
import { RenameSectionDialog } from '@/features/sections/components/rename-section-dialog';
import { SECTION_DETAILS } from '@/features/sections/schemas';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { Section } from '@/features/sections/schemas';

export function SectionsTable({ sections }: { sections: Section[] }) {
  const [renaming, setRenaming] = useState<Section | null>(null);

  const columns: DataTableColumn<Section>[] = [
    { id: 'position', header: 'Position', cell: (section) => sections.indexOf(section) + 1, align: 'end', className: 'w-20' },
    { id: 'heading', header: 'Heading', cell: (section) => <span className="font-medium">{section.heading}</span> },
    {
      id: 'section',
      header: 'Shows',
      isSecondary: true,
      cell: (section) => (
        <span className="flex flex-col">
          <span>{SECTION_DETAILS[section.key].name}</span>
          <span className="text-muted-foreground">{SECTION_DETAILS[section.key].description}</span>
        </span>
      ),
    },
    {
      id: 'visible',
      header: 'Visible',
      cell: (section) => (
        <VisibilityToggle
          isVisible={section.isVisible}
          itemLabel={section.heading}
          onChange={(isVisible) => setSectionVisibility(section.key, isVisible)}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        caption="Portfolio sections"
        columns={columns}
        rows={sections}
        getRowId={(section) => section.key}
        getRowLabel={(section) => section.heading}
        emptyState={
          <EmptyState
            icon={PanelsTopLeftIcon}
            title="No sections found"
            description="Restart the backend to create the default sections."
          />
        }
        rowActions={(section) => (
          <RowActions
            itemLabel={section.heading}
            actions={[
              {
                label: 'Rename',
                icon: PencilIcon,
                onSelect: () => {
                  setRenaming(section);
                },
              },
            ]}
          />
        )}
      />
      {renaming !== null && (
        <RenameSectionDialog
          section={renaming}
          onClose={() => {
            setRenaming(null);
          }}
        />
      )}
    </>
  );
}
