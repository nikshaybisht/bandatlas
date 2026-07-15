import { dismissWelcome } from '../lib/theme'

type Props = {
  exampleName: string
  onOpenExample: () => void
  onDismiss: () => void
}

export function WelcomeCard({ exampleName, onOpenExample, onDismiss }: Props) {
  const close = () => {
    dismissWelcome()
    onDismiss()
  }

  return (
    <div className="welcome-card" role="dialog" aria-labelledby="welcome-title">
      <div className="welcome-body">
        <h2 id="welcome-title" className="welcome-title">
          Welcome to BandAtlas
        </h2>
        <p>
          Browse teaching-quality <strong>UV–Vis</strong>, <strong>IR</strong>, and{' '}
          <strong>Raman</strong> curves for common small molecules — with structures and export.
        </p>
        <p className="welcome-honesty">
          Most curves are <strong>teaching envelopes</strong>, not certified experimental
          digitizations. Always cite primary literature for research numbers.
        </p>
        <div className="welcome-actions">
          <button
            type="button"
            className="welcome-primary"
            onClick={() => {
              onOpenExample()
              close()
            }}
          >
            Open example ({exampleName})
          </button>
          <button type="button" className="ghost" onClick={close}>
            Dismiss
          </button>
        </div>
      </div>
      <button
        type="button"
        className="welcome-close"
        aria-label="Dismiss welcome"
        onClick={close}
      >
        ×
      </button>
    </div>
  )
}
