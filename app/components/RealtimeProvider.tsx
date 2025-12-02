'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface RealtimeContextType {
  connected: boolean
  notifications: number
  activities: any[]
}

const RealtimeContext = createContext<RealtimeContextType>({
  connected: false,
  notifications: 0,
  activities: []
})

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState(0)
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const eventSource = new EventSource('/api/kasa/realtime/events', {
      withCredentials: true
    })

    eventSource.onopen = () => {
      setConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'update') {
          setNotifications(data.data.notifications || 0)
          setActivities((prev) => [...(data.data.activities || []), ...prev].slice(0, 50))
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = () => {
      setConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ connected, notifications, activities }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => useContext(RealtimeContext)

