'use client';

import { PanelsTopLeftIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { moveRowActions } from '@/components/data-table/item-row-actions';
import { RowActions } from '@/components/data-table/row-actions';
import { useOptimisticOrder } from '@/components/data-table/use-optimistic-order';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { reorderSections, setSectionVisibility } from '@/features/sections/actions';
import { RenameSectionDialog } from '@/features/sections/components/rename-section-dialog';
import { SECTION_DETAILS } from '@/features/sections/schemas';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { Section } from '@/features/sections/schemas';

// The hero is the top of the page and holds its main heading, so it keeps its place.
const isHero = (section: Section): boolean => section.key === 'hero';

export function SectionsTable({ sections }: { sections: Section[] }) {
  const [renaming, setRenaming] = useState<Section | null>(null);
  const { orderedRows, move, moveTo } = useOptimisticOrder(sections, (section) => section.key, reorderSections);

  const columns: DataTableColumn<Section>[] = [
    {
      id: 'position',
      header: 'Position',
      isSecondary: true,
      cell: (section) => orderedRows.indexOf(section) + 1,
      align: 'end',
      className: 'w-20',
    },
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
        rows={orderedRows}
        sorting={{ onMoveTo: moveTo, isRowLocked: isHero }}
        getRowId={(section) => section.key}
        getRowLabel={(section) => section.heading}
        emptyState={
          <EmptyState
            icon={PanelsTopLeftIcon}
            title="No sections found"
            description="Restart the backend to create the default sections."
          />
        }
        rowActions={(section) => {
          const index = orderedRows.indexOf(section);
          return (
            <RowActions
              itemLabel={section.heading}
              actions={[
                ...moveRowActions({
                  // Nothing moves above the hero.
                  isFirst: index <= 1,
                  isLast: index === orderedRows.length - 1,
                  lockedReason: isHero(section) ? 'The hero stays at the top' : undefined,
                  onMove: (offset) => {
                    move(index, offset);
                  },
                }),
                {
                  label: 'Rename',
                  icon: PencilIcon,
                  onSelect: () => {
                    setRenaming(section);
                  },
                },
              ]}
            />
          );
        }}
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
