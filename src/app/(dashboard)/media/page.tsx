import { ImagesIcon } from 'lucide-react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { EmptyState } from '@/components/feedback/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { MediaDetailsSheet } from '@/features/media/components/media-details-sheet';
import { MediaFilterTabs } from '@/features/media/components/media-filter-tabs';
import { MediaGrid } from '@/features/media/components/media-grid';
import { UploadPanel } from '@/features/media/components/upload-panel';
import { getMediaByIds, getMediaPage, getMediaUsages, getUploadStatus } from '@/features/media/queries';
import { parseListParams } from '@/lib/utils/list-params';

import type { MediaKind } from '@/features/media/schemas';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Media' };

function parseKind(value: string | string[] | undefined): MediaKind | undefined {
  return value === 'image' || value === 'document' ? value : undefined;
}

export default async function MediaPage({ searchParams }: PageProps<'/media'>) {
  const query = await searchParams;
  const kind = parseKind(query.kind);
  const selectedId = typeof query.file === 'string' ? query.file : null;

  const [page, uploadStatus, selected] = await Promise.all([
    getMediaPage(kind, { params: parseListParams(query), pathname: '/media', searchParams: query }),
    getUploadStatus(),
    // A file that was just deleted (or a stale link) simply shows no details sheet.
    getMediaByIds([selectedId]).then((found) => (selectedId === null ? null : (found[selectedId] ?? null))),
  ]);
  const usages = selected === null ? [] : await getMediaUsages(selected.id);

  return (
    <>
      <PageHeader title="Media" description="Images and PDFs used across the portfolio. Choose a file to see its details." />
      <UploadPanel isConfigured={uploadStatus.isConfigured} />
      <div className="flex flex-col gap-4">
        <MediaFilterTabs current={kind} />
        {page.items.length === 0 ? (
          <EmptyState
            icon={ImagesIcon}
            title={kind === undefined ? 'No files yet' : kind === 'image' ? 'No images yet' : 'No documents yet'}
            description="Uploaded files appear here, newest first."
          />
        ) : (
          <MediaGrid items={page.items} />
        )}
        <DataTablePagination pagination={page.pagination} itemNoun={{ singular: 'file', plural: 'files' }} />
      </div>
      {selected !== null && <MediaDetailsSheet key={selected.id} media={selected} usages={usages} />}
    </>
  );
}
