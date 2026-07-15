import { useCallback, type ReactNode } from 'react'
import Button from '@/components/ui/Button.tsx'
import { GridIcon, BagIcon, ClipboardIcon, PeopleIcon, GlobeIcon, CogIcon } from '@/components/Icons.tsx'
import { useTourContext } from '@/contexts/TourContext.tsx'
import { tourSteps, type TourIconName } from '@/config/tourSteps.ts'

const iconMap: Record<TourIconName, ReactNode> = {
  welcome: <GridIcon />,
  dashboard: <GridIcon />,
  products: <BagIcon />,
  orders: <ClipboardIcon />,
  customers: <PeopleIcon />,
  website: <GlobeIcon />,
  settings: <CogIcon />,
}

export default function TourOverlay() {
  const { isActive, currentStep, totalSteps, next, prev, skip, complete } = useTourContext()
  const step = tourSteps[currentStep]

  const handleNext = useCallback(() => {
    if (currentStep === totalSteps - 1) {
      complete()
      return
    }
    next()
  }, [currentStep, totalSteps, next, complete])

  if (!isActive || !step) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            {iconMap[step.icon]}
          </div>
          <h2 className="text-lg font-semibold text-stone-900">{step.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.description}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          {tourSteps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-6 bg-teal-600' : 'w-1.5 bg-stone-300'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={skip}>
            Lewati
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="secondary" size="sm" onClick={prev}>
                Sebelumnya
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="min-w-[80px]">
              {currentStep === totalSteps - 1 ? 'Selesai' : 'Selanjutnya'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
