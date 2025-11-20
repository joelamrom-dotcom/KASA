'use client'

import { useState, useEffect } from 'react'
import {
  ComputerDesktopIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import ConfirmationDialog from '@/app/components/ConfirmationDialog'

interface Session {
  _id: string
  userId: {
    _id: string
    email: string
    firstName: string
    lastName: string
  }
  ipAddress?: string
  userAgent?: string
  deviceInfo?: Record<string, any>
  location?: Record<string, any>
  isActive: boolean
  lastActivity: string
  expiresAt: string
  revokedAt?: string
  revokedBy?: {
    _id: string
    email: string
  }
  createdAt: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setCurrentToken(token)
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/sessions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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

  const handleRevokeClick = (session: Session) => {
    setSessionToRevoke(session)
    setShowRevokeDialog(true)
  }

  const handleRevoke = async () => {
    if (!sessionToRevoke) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/sessions/${sessionToRevoke._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        fetchSessions()
        setShowRevokeDialog(false)
        setSessionToRevoke(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to revoke session')
      }
    } catch (error) {
      console.error('Error revoking session:', error)
      alert('Error revoking session')
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? You will remain logged in on this device.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/sessions/revoke-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentToken }),
      })

      if (res.ok) {
        fetchSessions()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to revoke sessions')
      }
    } catch (error) {
      console.error('Error revoking sessions:', error)
      alert('Error revoking sessions')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getDeviceInfo = (session: Session) => {
    if (session.deviceInfo) {
      return `${session.deviceInfo.device || 'Unknown'} - ${session.deviceInfo.os || 'Unknown OS'}`
    }
    if (session.userAgent) {
      // Simple parsing
      if (session.userAgent.includes('Mobile')) return 'Mobile Device'
      if (session.userAgent.includes('Windows')) return 'Windows'
      if (session.userAgent.includes('Mac')) return 'Mac'
      if (session.userAgent.includes('Linux')) return 'Linux'
    }
    return 'Unknown'
  }

  const isCurrentSession = (session: Session) => {
    // This is a simplified check - in production, you'd compare tokens
    return session.isActive && !session.revokedAt
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  const activeSessions = sessions.filter(s => s.isActive && !s.revokedAt)
  const revokedSessions = sessions.filter(s => !s.isActive || s.revokedAt)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Active Sessions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your active login sessions
            </p>
          </div>
          {activeSessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Revoke All Other Sessions
            </button>
          )}
        </div>

        {/* Active Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Active Sessions ({activeSessions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => (
              <div
                key={session._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ComputerDesktopIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {getDeviceInfo(session)}
                      </h3>
                      {isCurrentSession(session) && (
                        <span className="text-xs text-green-600 dark:text-green-400">Current Session</span>
                      )}
                    </div>
                  </div>
                  {!isCurrentSession(session) && (
                    <button
                      onClick={() => handleRevokeClick(session)}
                      className="text-red-600 hover:text-red-800"
                      title="Revoke Session"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">IP Address: </span>
                    <span className="text-gray-900 dark:text-gray-100">{session.ipAddress || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Last Activity: </span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(session.lastActivity)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Expires: </span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(session.expiresAt)}</span>
                  </div>
                  {session.location && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Location: </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {session.location.city || 'Unknown'}, {session.location.country || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revoked Sessions */}
        {revokedSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Revoked Sessions ({revokedSessions.length})
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revoked At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revoked By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {revokedSessions.map(session => (
                      <tr key={session._id} className="opacity-60">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {getDeviceInfo(session)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {session.ipAddress || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {session.revokedAt ? formatDate(session.revokedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {session.revokedBy?.email || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Revoke Confirmation */}
        <ConfirmationDialog
          isOpen={showRevokeDialog}
          onClose={() => {
            setShowRevokeDialog(false)
            setSessionToRevoke(null)
          }}
          onConfirm={handleRevoke}
          title="Revoke Session"
          message={`Are you sure you want to revoke this session? The user will be logged out from this device.`}
          type="danger"
        />
      </div>
    </div>
  )
}

