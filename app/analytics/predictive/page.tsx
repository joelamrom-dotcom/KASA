'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function PredictiveAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/analytics/predictive', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading analytics...</div>
  }

  if (!data) {
    return <div className="min-h-screen p-8">No data available</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Predictive Analytics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Churn Risk</h3>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {data.churnRisk.atRiskCount}
            </div>
            <p className="text-sm text-gray-600">
              {data.churnRisk.atRiskPercentage.toFixed(1)}% of families at risk
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${data.revenueForecast.currentMonthly.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Current monthly revenue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data.lifecyclePredictions.upcomingBarMitzvahs}
            </div>
            <p className="text-sm text-gray-600">Bar Mitzvahs in next year</p>
          </div>
        </div>

        {data.churnRisk.families.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              At-Risk Families
            </h3>
            <div className="space-y-2">
              {data.churnRisk.families.map((family: any) => (
                <div key={family._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{family.name}</p>
                    <p className="text-sm text-gray-500">
                      Last payment: {family.lastPayment ? new Date(family.lastPayment).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

