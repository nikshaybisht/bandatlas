import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

/** Scripted 60s portfolio tour steps (auto-advance timers in Explorer). */
export type TourStepId = 'idle' | 'search' | 'uv' | 'ir' | 'export' | 'filter' | 'done'

export const TOUR_FEATURED_ID = 'rhodamine-b'

export const TOUR_STEP_COPY: Record<
  Exclude<TourStepId, 'idle' | 'done'>,
  { title: string; body: string }
> = {
  search: {
    title: '1 · Search',
    body: 'Type a name, CAS, or formula. Filters hide catalog-only rows.',
  },
  uv: {
    title: '2 · UV–Vis',
    body: 'Featured dye with a full teaching envelope — shape first, then absolute ε.',
  },
  ir: {
    title: '3 · IR',
    body: 'Same molecule, vibrational teaching bands for group-frequency discussion.',
  },
  export: {
    title: '4 · Export',
    body: 'CSV / JSON / lab note pack for notebooks — quality tags stay in the file headers.',
  },
  filter: {
    title: '5 · Full UV filter',
    body: '“Has full UV–Vis” shows only compounds with a curated curve (103 of 496).',
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
    // Land on featured compound; Explorer advances steps with timers
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
