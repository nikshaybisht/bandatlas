import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

// Step ids driven by timers in ExplorerPage
export type TourStepId = 'idle' | 'search' | 'uv' | 'ir' | 'export' | 'filter' | 'done'

export const TOUR_FEATURED_ID = 'rhodamine-b'

export const TOUR_STEP_COPY: Record<
  Exclude<TourStepId, 'idle' | 'done'>,
  { title: string; body: string }
> = {
  search: {
    title: '1 · Search',
    body: 'Type a name, CAS, or formula. Filters drop catalog-only rows.',
  },
  uv: {
    title: '2 · UV–Vis',
    body: 'Full teaching envelope for a dye — shape first, then absolute ε if you need it.',
  },
  ir: {
    title: '3 · IR',
    body: 'Same molecule, vibrational teaching bands.',
  },
  export: {
    title: '4 · Export',
    body: 'CSV / JSON / lab note pack — quality tags go in the file headers.',
  },
  filter: {
    title: '5 · Full UV filter',
    body: '“Has full UV–Vis” keeps compounds with a curated curve only.',
  },
}

type DemoTourContextValue = {
  step: TourStepId
  running: boolean
  startTour: () => void
  stopTour: () => void
  setStep: (s: TourStepId) => void
}

const DemoTourContext = createContext<DemoTourContextValue | null>(null)

export function DemoTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<TourStepId>('idle')
  const [running, setRunning] = useState(false)

  const stopTour = useCallback(() => {
    setRunning(false)
    setStep('idle')
  }, [])

  const startTour = useCallback(() => {
    setRunning(true)
    setStep('search')
    navigate(`/c/${TOUR_FEATURED_ID}?tech=uvvis&tour=1`, { replace: false })
  }, [navigate])

  const value = useMemo(
    () => ({ step, running, startTour, stopTour, setStep }),
    [step, running, startTour, stopTour],
  )

  return <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>
}

export function useDemoTour(): DemoTourContextValue {
  const ctx = useContext(DemoTourContext)
  if (!ctx) throw new Error('useDemoTour must be used within DemoTourProvider')
  return ctx
}
