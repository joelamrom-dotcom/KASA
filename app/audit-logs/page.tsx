'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuditLog {
  _id: string
  userId: string
  userEmail?: string
  userRole?: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  changes?: any
  description?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
  createdAt: string
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    startDate: '',
    endDate: '',
  })
  const [page, setPage] = useState(1)
  const limit = 50

  useEffect(() => {
    fetchAuditLogs()
  }, [page, filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: ((page - 1) * limit).toString(),
      })
      
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.action) params.append('action', filters.action)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const res = await fetch(`/api/kasa/audit-logs?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800'
    if (action.includes('update')) return 'bg-blue-100 text-blue-800'
    if (action.includes('delete')) return 'bg-red-100 text-red-800'
    if (action.includes('restore')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getEntityTypeColor = (entityType: string) => {
    const colors: any = {
      family: 'bg-purple-100 text-purple-800',
      payment: 'bg-green-100 text-green-800',
      member: 'bg-blue-100 text-blue-800',
      lifecycle_event: 'bg-yellow-100 text-yellow-800',
      payment_plan: 'bg-indigo-100 text-indigo-800',
      task: 'bg-pink-100 text-pink-800',
      note: 'bg-gray-100 text-gray-800',
      settings: 'bg-orange-100 text-orange-800',
    }
    return colors[entityType] || 'bg-gray-100 text-gray-800'
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      entityType: '',
      action: '',
      startDate: '',
      endDate: '',
    })
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Audit Logs</h1>
          <p className="text-gray-600">Track all changes and activities in the system</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="family">Family</option>
                <option value="member">Member</option>
                <option value="payment">Payment</option>
                <option value="lifecycle_event">Lifecycle Event</option>
                <option value="payment_plan">Payment Plan</option>
                <option value="task">Task</option>
                <option value="note">Note</option>
                <option value="settings">Settings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="restore">Restore</option>
                <option value="payment_create">Payment Create</option>
                <option value="family_create">Family Create</option>
                <option value="family_update">Family Update</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Logs ({total} total)
            </h2>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token')
                  const params = new URLSearchParams()
                  
                  if (filters.entityType) params.append('entityType', filters.entityType)
                  if (filters.action) params.append('action', filters.action)
                  if (filters.startDate) params.append('startDate', filters.startDate)
                  if (filters.endDate) params.append('endDate', filters.endDate)

                  const res = await fetch(`/api/kasa/audit-logs/export?${params.toString()}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  })

                  if (res.ok) {
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `audit-logs_${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } else {
                    alert('Failed to export audit logs')
                  }
                } catch (error) {
                  console.error('Error exporting audit logs:', error)
                  alert('Error exporting audit logs')
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date/Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">{log.userEmail || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{log.userRole || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(log.entityType)}`}>
                              {log.entityType}
                            </span>
                            {log.entityName && (
                              <div className="text-xs text-gray-500 mt-1">{log.entityName}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {log.description || 'No description'}
                        </td>
                        <td className="py-3 px-4">
                          {log.changes && Object.keys(log.changes).length > 0 ? (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-purple-600 hover:text-purple-800">
                                {Object.keys(log.changes).length} change(s)
                              </summary>
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                {Object.entries(log.changes).map(([key, value]: [string, any]) => (
                                  <div key={key} className="mb-1">
                                    <strong>{key}:</strong> {JSON.stringify(value.from)} → {JSON.stringify(value.to)}
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : (
                            <span className="text-gray-400 text-xs">No changes</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

