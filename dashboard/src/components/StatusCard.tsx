interface StatusCardProps {
  label: string
  value: string | null
  status?: 'success' | 'warning' | 'error' | 'neutral'
}

const styles: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
}

export default function StatusCard({ label, value, status = 'neutral' }: StatusCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${styles[status]}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value ?? '—'}</p>
    </div>
  )
}
