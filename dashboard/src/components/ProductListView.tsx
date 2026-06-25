import { useNavigate } from 'react-router'
import type { Product } from '@/hooks/useProducts.ts'
import Badge from '@/components/ui/Badge.tsx'
import { formatPrice } from '@/utils/format'

interface ProductListViewProps {
  products: Product[]
  onDelete: (id: string) => void
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: 'name' | 'category' | 'price' | 'stock' | 'isAvailable') => void
}

function SortArrow({ field, current, dir }: { field: string; current: string; dir: 'asc' | 'desc' }) {
  if (field !== current) return null
  return <span className="ml-1 text-teal-600">{dir === 'asc' ? '\u2191' : '\u2193'}</span>
}

function SortTh({ field, label, current, dir, onSort, className }: { field: 'name' | 'category' | 'price' | 'stock' | 'isAvailable'; label: string; current: string; dir: 'asc' | 'desc'; onSort: (f: typeof field) => void; className?: string }) {
  return (
    <th className={`max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-xs font-medium uppercase tracking-wider ${className ?? ''}`}>
      <button onClick={() => onSort(field)} className="inline-flex items-center text-stone-500 transition-colors hover:text-stone-700">
        {label}
        <SortArrow field={field} current={current} dir={dir} />
      </button>
    </th>
  )
}

export default function ProductListView({ products, onDelete, sortField, sortDir, onSort }: ProductListViewProps) {
  const navigate = useNavigate()

  if (products.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left max-sm:text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            <SortTh field="name" label="Produk" current={sortField} dir={sortDir} onSort={onSort} />
            <SortTh field="category" label="Kategori" current={sortField} dir={sortDir} onSort={onSort} />
            <SortTh field="price" label="Harga" current={sortField} dir={sortDir} onSort={onSort} className="text-right" />
            <SortTh field="stock" label="Stok" current={sortField} dir={sortDir} onSort={onSort} className="text-center" />
            <SortTh field="isAvailable" label="Status" current={sortField} dir={sortDir} onSort={onSort} />
            <th className="w-20 max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr
              key={item.id}
              onClick={() => navigate(`/products/${item.id}`)}
              className="cursor-pointer border-b border-stone-50 transition-colors last:border-0 hover:bg-stone-50"
            >
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3">
                <div className="flex items-center gap-3">
                  <div className="max-sm:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-medium text-stone-400">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="max-sm:text-xs sm:text-sm font-medium text-stone-900">{item.name}</p>
                    {item.description && <p className="text-xs text-stone-400 line-clamp-1">{item.description}</p>}
                  </div>
                </div>
              </td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-xs text-stone-500">{item.category?.name ?? '-'}</td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-right font-medium tabular-nums text-stone-900">{formatPrice(item.price)}</td>
              <td className={`max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-center tabular-nums ${item.stock === 0 ? 'text-red-500' : 'text-stone-700'}`}>{item.stock}</td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3">
                <Badge variant={item.isAvailable ? 'green' : 'red'} dot>
                  {item.isAvailable ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}`) }}
                    className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-teal-600"
                    title="Edit"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                    className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Hapus"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
