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

  // This lifecycle method is called when an error is thrown in a descendant component
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  // This lifecycle method is called after an error is thrown in a descendant component
  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Caught error:", error, errorInfo)

    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Call the onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.state.errorInfo)
      ) : (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fff0f0', 
          border: '1px solid #ffcaca',
          borderRadius: '4px',
          color: '#e00'
        }}>
          <h3>Something went wrong during rendering</h3>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Show error details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>Component Stack Trace:</p>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
