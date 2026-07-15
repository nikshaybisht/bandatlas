import { TOUR_STEP_COPY, useDemoTour, type TourStepId } from '../context/DemoTourContext'

const ACTIVE: Exclude<TourStepId, 'idle' | 'done'>[] = [
  'search',
  'uv',
  'ir',
  'export',
  'filter',
]

export function TourOverlay() {
  const { step, running, stopTour } = useDemoTour()
  if (!running || step === 'idle' || step === 'done') return null

  const copy =
    step in TOUR_STEP_COPY
      ? TOUR_STEP_COPY[step as keyof typeof TOUR_STEP_COPY]
      : { title: 'Tour', body: '' }
  const idx = ACTIVE.indexOf(step as (typeof ACTIVE)[number])

  return (
    <div className="tour-coach" role="status" aria-live="polite" data-testid="tour-coach">
      <div className="tour-coach-inner">
        <div className="tour-coach-top">
          <strong>{copy.title}</strong>
          <span className="tour-progress">
            {idx >= 0 ? idx + 1 : '—'} / {ACTIVE.length}
          </span>
        </div>
        <p>{copy.body}</p>
        <div className="tour-coach-actions">
          <button type="button" className="ghost" onClick={stopTour}>
            Skip tour
          </button>
        </div>
      </div>
    </div>
  )
}
