'use client'

import { useState, useEffect } from 'react'
import { ShieldCheckIcon, ComputerDesktopIcon, KeyIcon } from '@heroicons/react/24/outline'

export default function SecurityPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/security/sessions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/security/sessions?id=${sessionId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        fetchSessions()
      }
    } catch (error) {
      console.error('Error revoking session:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Security & Sessions
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ComputerDesktopIcon className="h-6 w-6" />
            Active Sessions
          </h2>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.ipAddress || 'Unknown IP'}</p>
                    <p className="text-sm text-gray-500">{session.userAgent || 'Unknown device'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.isCurrent && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Current</span>
                    )}
                    {!session.isCurrent && (
                      <button
                        onClick={() => revokeSession(session._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

