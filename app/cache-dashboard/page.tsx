'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function CacheDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/cache/dashboard', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const invalidateCache = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        fetchStats()
      }
    } catch (error) {
      console.error('Error invalidating cache:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading cache statistics...</div>
  }

  const pieData = [
    { name: 'Cache Hits', value: stats?.totalHits || 0 },
    { name: 'Cache Misses', value: stats?.totalMisses || 0 }
  ]

  const COLORS = ['#10b981', '#ef4444']

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cache Dashboard
          </h1>
          <button
            onClick={invalidateCache}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Invalidate Cache
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Hit Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {(stats?.hitRate * 100 || 0).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Miss Rate</div>
            <div className="text-2xl font-bold text-red-600">
              {(stats?.missRate * 100 || 0).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Hits</div>
            <div className="text-2xl font-bold">{stats?.totalHits || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Misses</div>
            <div className="text-2xl font-bold">{stats?.totalMisses || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cache Hit/Miss Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-medium">{stats?.performance?.avgResponseTime || 0}ms</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Cached Response Time</span>
                  <span className="text-sm font-medium">{stats?.performance?.cachedResponseTime || 0}ms</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Performance Improvement</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats?.performance?.improvement || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

