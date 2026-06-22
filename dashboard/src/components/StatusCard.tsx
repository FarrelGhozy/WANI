import type { ReactNode } from 'react'
import Card from './ui/Card.tsx'

interface StatusCardProps {
  label: string
  value: string
  accent: 'teal' | 'amber' | 'red'
  icon?: ReactNode
  subText?: string
}

export default function StatusCard({ label, value, accent, icon, subText }: StatusCardProps) {
  return (
    <Card accent={accent}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
          <p className="text-2xl font-semibold text-stone-900">{value}</p>
          {subText && <p className="text-xs text-stone-400">{subText}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${
            accent === 'teal' ? 'bg-teal-50 text-teal-600' :
            accent === 'amber' ? 'bg-amber-50 text-amber-600' :
            'bg-red-50 text-red-600'
          }`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
