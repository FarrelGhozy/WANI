import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Product } from '@/hooks/useProducts.ts'
import Badge from '@/components/ui/Badge.tsx'
import { formatPrice } from '@/utils/format.ts'
import { mediaUrl } from '@/lib/media.ts'

interface ProductCardProps {
  product: Product
  onDelete: (id: string) => void
}

export default function ProductCard({ product: item, onDelete }: ProductCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <div className="group relative rounded-xl border border-stone-200 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all hover:shadow-md">
      {/* Image area */}
      <div className="flex aspect-[4/3] items-center justify-center rounded-t-xl bg-stone-50">
        {item.imageUrl && !imgError ? (
          <img src={mediaUrl(item.imageUrl)} alt={item.name} className="h-full w-full rounded-t-xl object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-xl font-bold text-stone-300">
              {item.name.charAt(0)}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-stone-900">{item.name}</h3>
            <p className="text-xs text-stone-400">{item.category?.name ?? 'Tanpa Kategori'}</p>
          </div>
          <Badge variant={item.isAvailable ? 'green' : 'red'} dot>
            {item.isAvailable ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>

        <p className="text-lg font-semibold text-stone-900">{formatPrice(item.price)}</p>

        <div className="flex items-center justify-between">
          <span className={`text-xs ${item.stock === 0 ? 'font-medium text-red-500' : 'text-stone-500'}`}>
            {item.stock === 0 ? 'Stok Habis' : `${item.stock} tersedia`}
          </span>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => navigate(`/products/${item.id}`)}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-teal-600"
              title="Edit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Hapus"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
