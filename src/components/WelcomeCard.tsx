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
          UV–Vis, IR, and Raman for common small molecules — with structures and export for notes.
        </p>
        <p className="welcome-honesty">
          Most curves are <strong>teaching envelopes</strong>. Don’t cite them as experimental SI.
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
