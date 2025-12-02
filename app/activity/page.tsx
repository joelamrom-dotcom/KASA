'use client'

import { useState } from 'react'
import ActivityFeed from '@/app/components/ActivityFeed'

export default function ActivityPage() {
  const [entityType, setEntityType] = useState<string>('')
  const [entityId, setEntityId] = useState<string>('')

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Activity Feed
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Type</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="family">Families</option>
                <option value="member">Members</option>
                <option value="payment">Payments</option>
                <option value="event">Events</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Entity ID (optional)</label>
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter entity ID"
              />
            </div>
          </div>
        </div>

        <ActivityFeed entityType={entityType || undefined} entityId={entityId || undefined} />
      </div>
    </div>
  )
}

