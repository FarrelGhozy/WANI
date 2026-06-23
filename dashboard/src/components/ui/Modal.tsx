import { useEffect, useRef, type ReactNode } from 'react'
import Button from './Button.tsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
}

export default function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="mx-4 w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
        {actions && (
          <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-6 py-4">
            <Button variant="secondary" size="sm" onClick={onClose}>Batal</Button>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
