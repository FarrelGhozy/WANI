interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-stone-200'
  const variantClass = variantClasses[variant]

  const style: Record<string, string | number> = {}
  if (width !== undefined) style.width = width
  if (height !== undefined) style.height = height

  return (
    <div
      className={`${baseClasses} ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
  height?: string | number
}

export function SkeletonCard({ className = '', height = 'h-48' }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl border border-stone-200 p-4 ${className}`} aria-hidden="true">
      <Skeleton variant="rectangular" className={`w-full ${height}`} />
      <div className="mt-3 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  cols?: number
  className?: string
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-stone-200 ${className}`} aria-hidden="true">
      <div className="divide-y divide-stone-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                variant="text"
                className={`h-4 ${
                  colIdx === 0 ? 'w-8' : colIdx === 1 ? 'w-24' : colIdx === 2 ? 'w-32' : 'w-16'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
