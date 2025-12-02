'use client'

import { ReactNode } from 'react'

interface LoadingStateProps {
  loading: boolean
  children: ReactNode
  skeleton?: ReactNode
}

export default function LoadingState({ loading, children, skeleton }: LoadingStateProps) {
  if (loading) {
    return skeleton || (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}

