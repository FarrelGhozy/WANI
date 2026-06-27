import { createPortal } from 'react-dom'
import type { Toast } from '@/hooks/useToast'

const colors: Record<Toast['type'], string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  info: 'border-stone-300 bg-stone-50 text-stone-800',
}

const icons: Record<Toast['type'], string> = {
  success: '\u2713',
  error: '\u2717',
  info: '\u2139',
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-300 ${colors[t.type]}`}
        >
          <span className="text-base">{icons[t.type]}</span>
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 text-current/60 hover:text-current"
          >
            \u2715
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
