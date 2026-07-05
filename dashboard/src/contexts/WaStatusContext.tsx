import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useWaStatus, type WaStatus } from '@/hooks/useWaStatus.ts'

const WaStatusContext = createContext<WaStatus | null>(null)

export function WaStatusProvider({ children }: { children: ReactNode }) {
  const status = useWaStatus()
  const { qr, connection, phone, connectedAt, pairingCode, pairingPhone, loading, error } = status
  const value = useMemo(
    () => status,
    [qr, connection, phone, connectedAt, pairingCode, pairingPhone, loading, error],
  )
  return (
    <WaStatusContext.Provider value={value}>
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
