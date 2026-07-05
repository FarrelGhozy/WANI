import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { CheckIcon, CloseIcon, InfoIcon, AlertTriangleIcon } from '@/components/Icons.tsx'
import type { Toast } from '@/hooks/useToast'

const colors: Record<Toast['type'], string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  info: 'border-stone-300 bg-stone-50 text-stone-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
}

const icons: Record<Toast['type'], ReactNode> = {
  success: <CheckIcon size={16} />,
  error: <CloseIcon size={16} />,
  info: <InfoIcon size={16} />,
  warning: <AlertTriangleIcon size={16} />,
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
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${colors[t.type]}`}
        >
          <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
          <div className="min-w-0 flex-1">
            {t.title && <p className="text-xs font-semibold">{t.title}</p>}
            <p>{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick()
                  onRemove(t.id)
                }}
                className="mt-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 shrink-0 text-current/60 hover:text-current"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
