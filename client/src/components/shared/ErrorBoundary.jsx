import { AlertTriangle } from 'lucide-react'
import { Component } from 'react'
import Button from '../ui/Button'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Keep error visibility in development for debugging issues quickly.
    console.error('Unhandled UI error', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-lg p-6 text-center">
          <div className="mx-auto inline-flex rounded-full bg-rose-50 p-3 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <h1 className="mt-4 font-display text-3xl text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            Aplikasi mengalami error yang tidak terduga. Silakan refresh untuk mencoba kembali.
          </p>
          <Button className="mt-6" onClick={this.handleReload}>
            Reload Dashboard
          </Button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
