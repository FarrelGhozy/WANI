import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  accent?: 'teal' | 'amber' | 'red' | 'none'
  className?: string
  padding?: boolean
}

const accentBorders: Record<string, string> = {
  teal: 'border-l-teal-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  none: '',
}

export default function Card({ children, accent = 'none', className = '', padding = true }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-stone-200 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06)] ${accent !== 'none' ? 'border-l-4 ' + accentBorders[accent] : ''} ${padding ? 'p-4 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
