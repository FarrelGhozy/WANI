import { useSyncExternalStore, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  title?: string
  type: 'success' | 'error' | 'info' | 'warning'
  action?: { label: string; onClick: () => void }
}

interface ToastOptions {
  message: string
  title?: string
  type?: Toast['type']
  duration?: number
  action?: { label: string; onClick: () => void }
}

let nextId = 1
let toasts: Toast[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function addToast(messageOrOptions: string | ToastOptions, type?: Toast['type']) {
  const id = String(nextId++)

  let options: ToastOptions
  if (typeof messageOrOptions === 'string') {
    options = { message: messageOrOptions, type: type ?? 'success' }
  } else {
    options = messageOrOptions
  }

  const toast: Toast = {
    id,
    message: options.message,
    title: options.title,
    type: options.type ?? 'success',
    action: options.action,
  }

  toasts = [...toasts, toast]
  emit()

  const duration = options.duration ?? 3500
  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      emit()
    }, duration)
  }
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

function getSnapshot() {
  return toasts
}

export function getErrorMessage(err: unknown, fallback?: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return fallback ?? 'Terjadi kesalahan'
}

export function useToast() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const toast = useCallback(
    (messageOrOptions: string | ToastOptions, type?: Toast['type']) => {
      addToast(messageOrOptions, type)
    },
    [],
  )

  const apiError = useCallback(
    (err: unknown, fallback?: string, retry?: () => void) => {
      const message = getErrorMessage(err, fallback ?? 'Terjadi kesalahan')
      addToast({
        message,
        type: 'error',
        duration: 0,
        action: retry ? { label: 'Coba Lagi', onClick: retry } : undefined,
      })
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])

  return { toasts: snapshot, toast, apiError, removeToast: dismiss }
}
