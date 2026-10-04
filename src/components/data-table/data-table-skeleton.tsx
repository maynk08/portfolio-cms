import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_ROW_COUNT = 5;

type DataTableSkeletonProps = {
  columnCount: number;
  rowCount?: number;
};

// Matches the table's frame and row height, so nothing jumps when the data arrives.
export function DataTableSkeleton({ columnCount, rowCount = DEFAULT_ROW_COUNT }: DataTableSkeletonProps) {
  const columns = Array.from({ length: columnCount }, (_value, index) => index);
  return (
    <div className="rounded-lg border" aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div className="flex gap-4 border-b px-2 py-3">
        {columns.map((column) => (
          <Skeleton key={column} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rowCount }, (_value, row) => (
        <div key={row} className="flex gap-4 border-b px-2 py-3 last:border-b-0">
          {columns.map((column) => (
            <Skeleton key={column} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
