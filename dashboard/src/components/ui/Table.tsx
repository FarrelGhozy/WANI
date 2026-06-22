import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string | ReactNode
  render?: (item: T) => ReactNode
  className?: string
  headerClass?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  loading?: boolean
  onRowClick?: (item: T) => void
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 animate-pulse rounded bg-stone-100 ${i === 0 ? 'w-8' : i === 1 ? 'w-24' : i === 2 ? 'w-32' : 'w-16'}`} />
        </td>
      ))}
    </tr>
  )
}

export default function Table<T>({
  columns, data, keyExtractor, loading, onRowClick, emptyIcon, emptyTitle, emptyDescription,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-500 ${col.headerClass ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 rounded-full bg-stone-50 p-3 text-stone-300">
                    {emptyIcon}
                  </div>
                  <p className="text-sm font-medium text-stone-600">{emptyTitle ?? 'No data'}</p>
                  {emptyDescription && <p className="mt-0.5 text-xs text-stone-400">{emptyDescription}</p>}
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-stone-50 transition-colors last:border-0 hover:bg-stone-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm text-stone-700 ${col.className ?? ''}`}>
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
