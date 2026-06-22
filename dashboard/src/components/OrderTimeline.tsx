import type { OrderStatus } from '../hooks/useOrders.ts'

interface TimelineStep {
  status: OrderStatus
  label: string
  time: string | null
  done: boolean
}

interface OrderTimelineProps {
  status: OrderStatus
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

const stepConfig: Array<{ status: OrderStatus | 'CANCELLED'; label: string }> = [
  { status: 'PENDING', label: 'Pesanan dibuat' },
  { status: 'CONFIRMED', label: 'Pembayaran dikonfirmasi' },
  { status: 'PROCESSING', label: 'Pesanan diproses' },
  { status: 'COMPLETED', label: 'Pesanan selesai' },
]

function buildSteps(status: OrderStatus, createdAt: string, updatedAt: string, paidAt: string | null): TimelineStep[] {
  if (status === 'CANCELLED') {
    return [
      { status: 'PENDING', label: 'Pesanan dibuat', time: createdAt, done: true },
      { status: 'CANCELLED', label: 'Pesanan dibatalkan', time: updatedAt, done: true },
    ]
  }

  const currentIdx = stepConfig.findIndex((s) => s.status === status)
  return stepConfig.map((s, i) => {
    const done = i <= currentIdx
    let time: string | null = null
    if (s.status === 'PENDING') {
      time = createdAt
    } else if (done) {
      if (s.status === 'CONFIRMED') time = paidAt ?? addMin(createdAt, 5)
      else if (s.status === 'PROCESSING') time = addMin(createdAt, 10)
      else if (s.status === 'COMPLETED') time = updatedAt
    }
    return { ...s, time, done }
  })
}

function addMin(time: string, min: number): string {
  const d = new Date(time)
  d.setMinutes(d.getMinutes() + min)
  return d.toISOString()
}

function fmt(time: string) {
  return new Date(time).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderTimeline({ status, createdAt, updatedAt, paidAt }: OrderTimelineProps) {
  const steps = buildSteps(status, createdAt, updatedAt, paidAt)
  if (steps.length === 0) return null

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Line */}
          {i < steps.length - 1 && (
            <div className={`absolute left-[11px] top-5 h-full w-0.5 ${step.done ? 'bg-teal-200' : 'bg-stone-200'}`} />
          )}

          {/* Dot */}
          <div className={`relative z-10 mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
            step.done ? 'bg-teal-50' : 'bg-stone-50'
          }`}>
            {step.done ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-teal-600">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <div className="h-2 w-2 rounded-full bg-stone-300" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={`text-sm ${step.done ? 'font-medium text-stone-900' : 'text-stone-400'}`}>
              {step.label}
            </p>
            {step.time && (
              <p className="text-xs text-stone-400">{fmt(step.time)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
