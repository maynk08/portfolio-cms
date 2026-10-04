// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { FileTextIcon, PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BulkActionBar } from '@/components/data-table/bulk-action-bar';
import { DataTable } from '@/components/data-table/data-table';
import { RowActions } from '@/components/data-table/row-actions';
import { EmptyState } from '@/components/feedback/empty-state';

import { resetNavigationMocks } from '../helpers/next-mocks';
import { renderWithProviders } from '../helpers/render';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { ActionResult } from '@/lib/actions/action-result';

vi.mock('next/navigation', async (importOriginal) =>
  (await import('../helpers/next-mocks')).createNavigationModule(await importOriginal()),
);
vi.mock('next/link', async () => ({ default: (await import('../helpers/next-mocks')).MockLink }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface Row {
  id: string;
  title: string;
  views: number;
  note: string;
}

const rows: Row[] = [
  { id: 'a', title: 'Portfolio CMS', views: 1200, note: 'First' },
  { id: 'b', title: 'Blog engine', views: 35, note: 'Second' },
];

const columns: DataTableColumn<Row>[] = [
  { id: 'title', header: 'Title', cell: (row) => row.title },
  { id: 'views', header: 'Views', cell: (row) => row.views.toLocaleString('en'), align: 'end' },
  { id: 'note', header: 'Note', cell: (row) => row.note, isSecondary: true },
];

const emptyState = <EmptyState icon={FileTextIcon} title="No projects yet" description="Projects you add appear here." />;

function SelectableTable() {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  return (
    <>
      <BulkActionBar
        selectedCount={selectedIds.size}
        itemNoun={{ singular: 'project', plural: 'projects' }}
        onClearSelection={() => {
          setSelectedIds(new Set());
        }}
      >
        <button type="button">Delete selected</button>
      </BulkActionBar>
      <DataTable
        caption="Projects"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.title}
        emptyState={emptyState}
        selection={{ selectedIds, onChange: setSelectedIds }}
      />
    </>
  );
}

beforeEach(() => {
  resetNavigationMocks();
  vi.mocked(toast.success).mockClear();
});

describe('DataTable', () => {
  it('renders the columns with their alignment, and hides secondary columns on phones', () => {
    renderWithProviders(
      <DataTable
        caption="Projects"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.title}
        emptyState={emptyState}
      />,
    );

    const table = screen.getByRole('table', { name: 'Projects' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Title', 'Views', 'Note']);
    expect(screen.getByRole('cell', { name: '1,200' })).toHaveClass('text-right', 'tabular-nums');
    expect(screen.getByRole('cell', { name: 'First' })).toHaveClass('hidden', 'md:table-cell');
  });

  it('shows the empty state instead of an empty table', () => {
    renderWithProviders(
      <DataTable
        caption="Projects"
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.title}
        emptyState={emptyState}
      />,
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No projects yet' })).toBeInTheDocument();
  });

  it('selects rows one by one or all at once, and shows the count', async () => {
    const { user } = renderWithProviders(<SelectableTable />);
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows on this page' });

    await user.click(screen.getByRole('checkbox', { name: 'Select "Blog engine"' }));
    expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByRole('region', { name: 'Bulk actions' })).toHaveTextContent('1 project selected');

    await user.click(selectAll);
    expect(screen.getByRole('checkbox', { name: 'Select "Portfolio CMS"' })).toBeChecked();
    expect(screen.getByRole('region', { name: 'Bulk actions' })).toHaveTextContent('2 projects selected');

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
    expect(selectAll).not.toBeChecked();
  });
});

describe('RowActions', () => {
  function renderActions(onConfirm: () => Promise<ActionResult<unknown>>, onFeature = vi.fn()) {
    return renderWithProviders(
      <RowActions
        itemLabel="Portfolio CMS"
        actions={[
          { label: 'Edit', icon: PencilIcon, href: '/projects/a' },
          { label: 'Preview', icon: FileTextIcon, onSelect: vi.fn(), disabledReason: 'Hidden projects have no public page' },
          { label: 'Feature', icon: StarIcon, onSelect: onFeature },
          { label: 'Duplicate', icon: FileTextIcon, onSelect: vi.fn() },
        ]}
        destructiveActions={[
          {
            label: 'Delete',
            icon: Trash2Icon,
            confirm: {
              title: 'Delete project "Portfolio CMS"?',
              description: 'Its 4 screenshots will be detached. This cannot be undone.',
              confirmLabel: 'Delete',
              pendingLabel: 'Deleting…',
            },
            onConfirm,
          },
        ]}
      />,
    );
  }

  it('shows the first three actions as buttons and the rest in the menu, with delete separated', async () => {
    const onFeature = vi.fn();
    const { user } = renderActions(() => Promise.resolve({ ok: true, message: 'Deleted', data: null }), onFeature);

    expect(screen.getByRole('link', { name: 'Edit "Portfolio CMS"' })).toHaveAttribute('href', '/projects/a');
    expect(screen.getByLabelText('Preview "Portfolio CMS": Hidden projects have no public page')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Feature "Portfolio CMS"' }));
    expect(onFeature).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Duplicate "Portfolio CMS"' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More actions for "Portfolio CMS"' }));
    const menu = screen.getByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Duplicate', 'Delete']);
    expect(within(menu).getByRole('separator')).toBeInTheDocument();
  });

  it('asks before deleting, with Cancel focused, and keeps the dialog open when deleting fails', async () => {
    const onConfirm = vi
      .fn<() => Promise<ActionResult<unknown>>>()
      .mockResolvedValueOnce({ ok: false, formError: 'This file is in use' })
      .mockResolvedValueOnce({ ok: true, message: 'Project "Portfolio CMS" deleted', data: null });
    const { user } = renderActions(onConfirm);

    await user.click(screen.getByRole('button', { name: 'More actions for "Portfolio CMS"' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    const dialog = await screen.findByRole('alertdialog', { name: 'Delete project "Portfolio CMS"?' });
    expect(dialog).toHaveTextContent('Its 4 screenshots will be detached. This cannot be undone.');
    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('This file is in use');
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith('Project "Portfolio CMS" deleted');
  });

  it('closes without deleting when cancelled', async () => {
    const onConfirm = vi.fn<() => Promise<ActionResult<unknown>>>();
    const { user } = renderActions(onConfirm);

    await user.click(screen.getByRole('button', { name: 'More actions for "Portfolio CMS"' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
