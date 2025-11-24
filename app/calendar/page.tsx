'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to events page with calendar view
    // The events page will handle showing the calendar view
    router.replace('/events?view=calendar')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Events...</p>
      </div>
    </div>
  )
}
