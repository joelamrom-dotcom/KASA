'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, XMarkIcon, ClockIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PerformanceMetrics {
  reportId: string
  reportName: string
  viewCount: number
  lastViewed: string
  averageGenerationTime: number
  dataRowCount: number
  exportCount: number
  scheduleCount: number
  cacheHitRate?: number
}

interface ReportPerformanceDashboardProps {
  onClose: () => void
}

export default function ReportPerformanceDashboard({ onClose }: ReportPerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/performance?timeRange=${timeRange}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics || [])
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalViews = metrics.reduce((sum, m) => sum + m.viewCount, 0)
  const totalExports = metrics.reduce((sum, m) => sum + m.exportCount, 0)
  const avgGenerationTime = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.averageGenerationTime, 0) / metrics.length
    : 0
  const totalRows = metrics.reduce((sum, m) => sum + m.dataRowCount, 0)

  const chartData = metrics.slice(0, 10).map(m => ({
    name: m.reportName.length > 20 ? m.reportName.substring(0, 20) + '...' : m.reportName,
    views: m.viewCount,
    exports: m.exportCount,
  }))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Report Performance Dashboard</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Loading metrics...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeIcon className="h-5 w-5 text-blue-600" />
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-green-600" />
                    <div className="text-sm text-gray-600">Total Exports</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{totalExports.toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                    <div className="text-sm text-gray-600">Avg Generation Time</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {avgGenerationTime.toFixed(2)}s
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-orange-600" />
                    <div className="text-sm text-gray-600">Total Data Rows</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{totalRows.toLocaleString()}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Top Reports by Views</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Top Reports by Exports</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="exports" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <h4 className="font-medium p-4 border-b">Report Details</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exports</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Viewed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metrics.map((metric) => (
                        <tr key={metric.reportId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {metric.reportName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{metric.viewCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{metric.exportCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {metric.averageGenerationTime.toFixed(2)}s
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{metric.dataRowCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(metric.lastViewed).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

