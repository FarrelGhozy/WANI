import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSettings } from '@/hooks/useSettings.ts'
import type { StoreProfile, AiConfig } from '@/hooks/useSettings.ts'

interface StoreContextType {
  store: StoreProfile | null
  aiConfig: AiConfig | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  updateStore: (patch: Partial<StoreProfile>) => Promise<void>
  updateAiConfig: (patch: Partial<AiConfig>) => Promise<void>
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { store, aiConfig, loading, error, updateStore, updateAiConfig, reload } = useSettings()
  const value = useMemo(
    () => ({ store, aiConfig, loading, error, updateStore, updateAiConfig, reload }),
    [store, aiConfig, loading, error, updateStore, updateAiConfig, reload],
  )
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreContext(): StoreContextType {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error('useStoreContext must be used within a StoreProvider')
  }
  return ctx
}
