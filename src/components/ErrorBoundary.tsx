import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chromascope UI error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong rendering this view</h2>
          <p>
            Try selecting another compound or reloading. If it persists, open an issue with the
            compound id and browser console output.
          </p>
          <pre>{this.state.error.message}</pre>
          <button type="button" className="ghost" onClick={() => this.setState({ error: null })}>
            Dismiss
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
