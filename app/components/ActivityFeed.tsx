'use client'

import { useState, useEffect } from 'react'
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline'

interface Activity {
  _id: string
  action: string
  entityType: string
  entityName?: string
  description?: string
  userId?: any
  createdAt: string
}

interface ActivityFeedProps {
  entityType?: string
  entityId?: string
  limit?: number
}

export default function ActivityFeed({ entityType, entityId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [entityType, entityId])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = '/api/kasa/activity?'
      if (entityType) url += `entityType=${entityType}&`
      if (entityId) url += `entityId=${entityId}&`
      url += `limit=${limit}`

      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    return ClockIcon
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  if (loading) {
    return <div className="text-center py-4">Loading activity...</div>
  }

  if (activities.length === 0) {
    return <div className="text-center py-8 text-gray-500">No activity found</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity._id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
          <div className="p-2 bg-blue-100 rounded-full">
            <ClockIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.userId?.firstName || 'System'}</span>
              {' '}
              <span className="text-gray-600">{activity.action.replace(/_/g, ' ')}</span>
              {' '}
              {activity.entityName && (
                <span className="font-medium">{activity.entityName}</span>
              )}
            </p>
            {activity.description && (
              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatTime(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

