import { createContext, useContext, type ReactNode } from 'react'
import { useWaStatus, type WaStatus } from '@/hooks/useWaStatus.ts'

const WaStatusContext = createContext<WaStatus | null>(null)

export function WaStatusProvider({ children }: { children: ReactNode }) {
  const status = useWaStatus()
  return (
    <WaStatusContext.Provider value={status}>
      {children}
    </WaStatusContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWaStatusContext(): WaStatus {
  const ctx = useContext(WaStatusContext)
  if (!ctx) {
    throw new Error('useWaStatusContext must be used within a WaStatusProvider')
  }
  return ctx
}
