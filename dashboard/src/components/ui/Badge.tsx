import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'green' | 'amber' | 'red' | 'gray' | 'teal'
  dot?: boolean
}

const styles: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-600/10',
  gray: 'bg-stone-100 text-stone-600 ring-1 ring-stone-400/10',
  teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/10',
}

const dotColors: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-stone-400',
  teal: 'bg-teal-500',
}

export default function Badge({ children, variant = 'gray', dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
