import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyText?: string;
}

export function Table<T>({
  columns,
  data,
  keyField,
  loading,
  emptyText = 'Tidak ada data',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {columns.map((col) => (
              <div key={col.key} className="h-4 flex-1 animate-pulse rounded bg-surface-200" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-surface-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 font-medium text-surface-500', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {data.map((row, idx) => (
            <tr key={String(row[keyField] ?? idx)} className="hover:bg-surface-50">
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-surface-700', col.className)}>
                  {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
