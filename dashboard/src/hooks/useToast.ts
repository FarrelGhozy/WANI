import { useSyncExternalStore, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let nextId = 1
let toasts: Toast[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function addToast(message: string, type: Toast['type'] = 'success') {
  const id = String(nextId++)
  toasts = [...toasts, { id, message, type }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3500)
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

export function useToast() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    addToast(message, type)
  }, [])

  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])

  return { toasts: snapshot, toast, removeToast: dismiss }
}
