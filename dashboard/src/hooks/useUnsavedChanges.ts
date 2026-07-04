import { useEffect } from 'react'
import { useBlocker } from 'react-router'

export function useUnsavedChanges(isDirty: boolean, message?: string) {
  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  if (blocker.state === 'blocked') {
    const msg = message ?? 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?'
    if (window.confirm(msg)) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }

  return blocker
}
