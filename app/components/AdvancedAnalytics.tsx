'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface AnalyticsData {
  yearOverYear: Array<{
    year: number
    totalRevenue: number
    paymentCount: number
    averagePayment: number
    monthlyBreakdown: Array<{
      month: number
      revenue: number
      count: number
    }>
  }>
  trends: {
    revenueGrowth: number
    paymentCountGrowth: number
    averagePaymentTrend: number
  }
  nextYearProjection: {
    year: number
    projectedRevenue: number
    projectedPaymentCount: number
    confidence: string
  }
  paymentMethodTrends: Record<string, number>
  memberCounts: number
  totalFamilies: number
}

export default function AdvancedAnalytics() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [years, setYears] = useState(3)

  useEffect(() => {
    fetchAnalytics()
  }, [years])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/analytics/advanced?years=${years}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const analyticsData = await res.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No analytics data available</div>
  }

  // Prepare chart data
  const yearOverYearData = data.yearOverYear.map(y => ({
    year: y.year.toString(),
    revenue: y.totalRevenue,
    payments: y.paymentCount,
    average: y.averagePayment
  }))

  const paymentMethodData = Object.entries(data.paymentMethodTrends).map(([method, count]) => ({
    method: method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Year-over-year comparisons and predictive insights</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Years:
            <select
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="ml-2 border rounded-lg px-3 py-2"
            >
              <option value={2}>2 Years</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
            </select>
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue Growth</p>
              <p className={`text-2xl font-bold mt-1 ${
                data.trends.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.trends.revenueGrowth >= 0 ? '+' : ''}{data.trends.revenueGrowth.toFixed(1)}%
              </p>
            </div>
            {data.trends.revenueGrowth >= 0 ? (
              <ArrowTrendingUpIcon className="h-12 w-12 text-green-500" />
            ) : (
              <ArrowTrendingDownIcon className="h-12 w-12 text-red-500" />
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment Count Growth</p>
              <p className={`text-2xl font-bold mt-1 ${
                data.trends.paymentCountGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.trends.paymentCountGrowth >= 0 ? '+' : ''}{data.trends.paymentCountGrowth.toFixed(1)}%
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.memberCounts}
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Next Year Projection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.nextYearProjection.projectedRevenue)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Year-over-Year Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Year-over-Year Revenue Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={yearOverYearData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value: any, name: string) => {
              if (name === 'revenue' || name === 'average') {
                return formatCurrency(value)
              }
              return value
            }} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Total Revenue" />
            <Line yAxisId="right" type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={2} name="Payment Count" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Method Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paymentMethodData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Payment Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Next Year Projection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Projected Revenue</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(data.nextYearProjection.projectedRevenue)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Projected Payments</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {data.nextYearProjection.projectedPaymentCount}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Confidence Level</p>
            <p className="text-2xl font-bold text-purple-600 mt-1 capitalize">
              {data.nextYearProjection.confidence}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

