import { Component, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">
              Terjadi Kesalahan
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {this.state.error?.message || 'Terjadi kesalahan yang tidak diketahui'}
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
            >
              <RefreshCw size={14} />
              Coba Lagi
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
