'use client'

import { ReactNode } from 'react'

interface MobileOptimizedTableProps {
  children: ReactNode
  className?: string
}

export default function MobileOptimizedTable({ children, className = '' }: MobileOptimizedTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 md:table">
            {children}
          </table>
        </div>
      </div>
    </div>
  )
}

