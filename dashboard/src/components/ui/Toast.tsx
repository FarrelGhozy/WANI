import { createPortal } from 'react-dom'
import { Check, X, Info } from 'lucide-react'
import type { Toast } from '@/hooks/useToast'

const colors: Record<Toast['type'], string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  info: 'border-stone-300 bg-stone-50 text-stone-800',
}

const icons: Record<Toast['type'], JSX.Element> = {
  success: <Check size={16} />,
  error: <X size={16} />,
  info: <Info size={16} />,
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${colors[t.type]}`}
        >
          <span className="shrink-0">{icons[t.type]}</span>
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 text-current/60 hover:text-current"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
