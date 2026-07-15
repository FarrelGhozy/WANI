import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import { tourSteps } from '@/config/tourSteps.ts'

const TOUR_KEY = 'wani_tour_completed'

interface TourContextType {
  isActive: boolean
  currentStep: number
  totalSteps: number
  next: () => void
  prev: () => void
  skip: () => void
  complete: () => void
}

const TourContext = createContext<TourContextType | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(() => !localStorage.getItem(TOUR_KEY))
  const [currentStep, setCurrentStep] = useState(0)

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true')
    setIsActive(false)
    setCurrentStep(0)
  }, [])

  const value = useMemo<TourContextType>(() => ({
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    next: () => setCurrentStep((s) => Math.min(s + 1, tourSteps.length - 1)),
    prev: () => setCurrentStep((s) => Math.max(s - 1, 0)),
    skip: finish,
    complete: finish,
  }), [isActive, currentStep, finish])

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTourContext(): TourContextType {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTourContext must be used within a TourProvider')
  return ctx
}
