import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Keeps a crash inside one converter from blanking the whole app; shows what failed instead. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Converter crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="soon" role="alert">
        <h2>Something went wrong</h2>
        <p>This converter failed to load: {this.state.error.message}</p>
        <button type="button" className="uc-clear" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    )
  }
}
