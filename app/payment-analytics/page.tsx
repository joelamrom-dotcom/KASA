'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

interface PaymentAnalytics {
  period: { start: string; end: string }
  analytics: any[]
  totals: {
    totalPayments: number
    totalAmount: number
    successfulPayments: number
    failedPayments: number
    averageAmount: number
    byMethod: { [key: string]: { count: number; amount: number } }
    byType: { [key: string]: { count: number; amount: number } }
    trends: Array<{ date: string; count: number; amount: number }>
  }
  payments: any[]
}

export default function PaymentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/payment-analytics?period=${period}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </main>
    )
  }

  if (!analytics) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 text-gray-500">No analytics data available</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Payment Analytics
          </h1>
          <p className="text-gray-600">Track and analyze payment trends</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-3xl font-bold text-gray-800">{analytics.totals.totalPayments}</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-gray-800">${analytics.totals.totalAmount.toLocaleString()}</p>
              </div>
              <CurrencyDollarIcon className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Amount</p>
                <p className="text-3xl font-bold text-gray-800">${analytics.totals.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <ArrowTrendingUpIcon className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-800">
                  {analytics.totals.totalPayments > 0 
                    ? ((analytics.totals.successfulPayments / analytics.totals.totalPayments) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {Object.entries(analytics.totals.byMethod).map(([method, data]: [string, any]) => (
              <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 capitalize">{method.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-600">{data.count} payments</p>
                </div>
                <p className="text-lg font-bold text-gray-800">${data.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Types Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Types</h2>
          <div className="space-y-3">
            {Object.entries(analytics.totals.byType).map(([type, data]: [string, any]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 capitalize">{type}</p>
                  <p className="text-sm text-gray-600">{data.count} payments</p>
                </div>
                <p className="text-lg font-bold text-gray-800">${data.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Trends */}
        {analytics.totals.trends.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Trends</h2>
            <div className="space-y-2">
              {analytics.totals.trends.slice(-14).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm text-gray-600">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{trend.count} payments</span>
                    <span className="font-semibold text-gray-800">${trend.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

