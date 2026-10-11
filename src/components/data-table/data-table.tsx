'use client';

import { LockedTableRow, SortableRows, SortableTableRow } from '@/components/data-table/sortable-rows';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';

import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  // Text starts left; numbers end right (with tabular figures).
  align?: 'start' | 'end';
  // Secondary columns are hidden on phones, so the table never needs to scroll sideways for the essentials.
  isSecondary?: boolean;
  // Keeps the header for screen readers only, for narrow columns such as a show/hide switch.
  isHeaderVisuallyHidden?: boolean;
  className?: string;
}

export interface DataTableSorting<T> {
  // Called when a row is dropped at another position (indexes into `rows`).
  onMoveTo: (fromIndex: number, toIndex: number) => void;
  // Rows that keep their place, such as the hero section.
  isRowLocked?: (row: T) => boolean;
}

export interface DataTableSelection {
  selectedIds: ReadonlySet<string>;
  onChange: (selectedIds: Set<string>) => void;
}

type DataTableProps<T> = {
  // Read by screen readers only, e.g. "Projects".
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  // Names a row for its checkbox label: `Select "Portfolio CMS"`.
  getRowLabel: (row: T) => string;
  // Rendered in the last column of every row.
  rowActions?: (row: T) => ReactNode;
  // Shown instead of the table when there are no rows.
  emptyState: ReactNode;
  selection?: DataTableSelection;
  // Adds a drag handle to every row, for manually ordered lists.
  sorting?: DataTableSorting<T>;
  // While the list refreshes after a change, the old rows stay visible, slightly dimmed.
  isRefreshing?: boolean;
};

function alignClass(align: 'start' | 'end' | undefined): string {
  return align === 'end' ? 'text-right tabular-nums' : 'text-left';
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  getRowLabel,
  rowActions,
  emptyState,
  selection,
  sorting,
  isRefreshing = false,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return emptyState;
  }

  const rowIds = rows.map(getRowId);
  const selectedOnPage = selection === undefined ? 0 : rowIds.filter((id) => selection.selectedIds.has(id)).length;
  const headerChecked = selectedOnPage === 0 ? false : selectedOnPage === rows.length ? true : 'indeterminate';

  const toggleAll = (checked: boolean): void => {
    if (selection === undefined) {
      return;
    }
    const next = new Set(selection.selectedIds);
    for (const id of rowIds) {
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
    }
    selection.onChange(next);
  };

  const toggleRow = (id: string, checked: boolean): void => {
    if (selection === undefined) {
      return;
    }
    const next = new Set(selection.selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    selection.onChange(next);
  };

  // The cells after the drag handle: selection checkbox, the columns, row actions.
  const renderCells = (row: T, id: string, isSelected: boolean): ReactNode => (
    <>
      {selection !== undefined && (
        <TableCell>
          <Checkbox
            aria-label={`Select "${getRowLabel(row)}"`}
            checked={isSelected}
            onCheckedChange={(checked) => {
              toggleRow(id, checked === true);
            }}
          />
        </TableCell>
      )}
      {columns.map((column) => (
        <TableCell
          key={column.id}
          className={cn('max-w-xs', alignClass(column.align), column.isSecondary === true && 'hidden md:table-cell', column.className)}
        >
          {column.cell(row)}
        </TableCell>
      ))}
      {rowActions !== undefined && <TableCell className="text-right">{rowActions(row)}</TableCell>}
    </>
  );

  return (
    <div aria-busy={isRefreshing} className={cn('rounded-lg border transition-opacity', isRefreshing && 'opacity-60')}>
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {sorting !== undefined && (
              <TableHead className="w-10">
                <span className="sr-only">Reorder</span>
              </TableHead>
            )}
            {selection !== undefined && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={headerChecked}
                  onCheckedChange={(checked) => {
                    toggleAll(checked === true);
                  }}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.id}
                // Headings wrap rather than being cut off when a narrow screen scrolls the table sideways.
                className={cn(
                  'whitespace-normal',
                  alignClass(column.align),
                  column.isSecondary === true && 'hidden md:table-cell',
                  column.className,
                )}
              >
                {column.isHeaderVisuallyHidden === true ? <span className="sr-only">{column.header}</span> : column.header}
              </TableHead>
            ))}
            {rowActions !== undefined && (
              <TableHead className="w-px text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorting === undefined ? (
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selection?.selectedIds.has(id) === true;
              return (
                <TableRow key={id} data-state={isSelected ? 'selected' : undefined}>
                  {renderCells(row, id, isSelected)}
                </TableRow>
              );
            })
          ) : (
            <SortableRows
              rowIds={rowIds}
              movableIds={rows.filter((row) => sorting.isRowLocked?.(row) !== true).map(getRowId)}
              getLabel={(id) => {
                const row = rows[rowIds.indexOf(id)];
                return row === undefined ? 'The row' : getRowLabel(row);
              }}
              onMoveTo={sorting.onMoveTo}
            >
              {rows.map((row) => {
                const id = getRowId(row);
                const isSelected = selection?.selectedIds.has(id) === true;
                return sorting.isRowLocked?.(row) === true ? (
                  <LockedTableRow key={id} isSelected={isSelected}>
                    {renderCells(row, id, isSelected)}
                  </LockedTableRow>
                ) : (
                  <SortableTableRow key={id} id={id} label={getRowLabel(row)} isSelected={isSelected}>
                    {renderCells(row, id, isSelected)}
                  </SortableTableRow>
                );
              })}
            </SortableRows>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
