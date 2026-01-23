import React from 'react'

// ErrorBoundary must be a class component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('ErrorBoundary caught:', error.message)
  }

  render() {
    if (this.state.hasError) {
      // Render fallback if provided, otherwise null
      return this.props.fallback || null
    }
    return this.props.children
  }
}
