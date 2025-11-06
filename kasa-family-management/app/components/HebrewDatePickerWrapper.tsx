'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class HebrewDatePickerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Suppress the onMouseOver error from react-jewish-datepicker
    if (error.message?.includes('onMouseOver') || error.stack?.includes('onMouseOver')) {
      console.warn('Suppressed Hebrew date picker mouse event error:', error.message)
      this.setState({ hasError: false })
      return
    }
    console.error('HebrewDatePicker error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

