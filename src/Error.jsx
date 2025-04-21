import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  // this lifecycle method is called when an error is thrown in a descendant component
  static getDerivedStateFromError(error) {
    // update state so the next render will show the fallback UI
    return { hasError: true }
  }

  // this lifecycle method is called after an error is thrown in a descendant component
  componentDidCatch(error, errorInfo) {
    // update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // call the onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.state.errorInfo)
      ) : (
        <div className="whitespace-pre-wrap font-mono text-red-500">
          <div>{this.state.error && this.state.error.toString()}</div>
          <div>{this.state.errorInfo && this.state.errorInfo.componentStack}</div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
