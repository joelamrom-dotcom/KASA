'use client'

import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowPathIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { showToast } from '@/lib/toast'

interface PaymentInsightsData {
  atRiskCount: number
  remindersSentToday: number
  upcomingPayments: number
  atRiskByLevel: {
    high: number
    medium: number
    low: number
  }
}

export default function PaymentInsightsWidget() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PaymentInsightsData | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch at-risk families
      const insightsRes = await fetch('/api/kasa/payments/insights', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      let atRiskCount = 0
      let atRiskByLevel = { high: 0, medium: 0, low: 0 }
      
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        atRiskCount = insightsData.total || 0
        atRiskByLevel = insightsData.byRiskLevel || { high: 0, medium: 0, low: 0 }
      }

      // Fetch reminders and upcoming payments stats
      const statsRes = await fetch('/api/kasa/payments/reminders-stats', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      let remindersSentToday = 0
      let upcomingPayments = 0
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        remindersSentToday = statsData.remindersSentToday || 0
        upcomingPayments = statsData.upcomingPayments || 0
      }

      setData({
        atRiskCount,
        remindersSentToday,
        upcomingPayments,
        atRiskByLevel
      })
    } catch (error) {
      console.error('Error fetching payment insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePaymentPlans = async () => {
    try {
      setUpdating(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payment-plans/update-all', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        const result = await res.json()
        showToast(
          `Updated ${result.results.updated} payment plans (checked ${result.results.checked} members)`,
          'success'
        )
        // Refresh data
        fetchData()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update payment plans', 'error')
      }
    } catch (error: any) {
      console.error('Error updating payment plans:', error)
      showToast('Error updating payment plans', 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
          Payment Insights
        </h3>
        <button
          onClick={fetchData}
          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* At-Risk Families */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">At-Risk Families</span>
            </div>
            <Link
              href="/payment-insights"
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              View All
              <LinkIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            {data?.atRiskCount || 0}
          </div>
          {data && data.atRiskCount > 0 && (
            <div className="flex gap-2 text-xs">
              <span className="text-red-700 dark:text-red-400">
                {data.atRiskByLevel.high} high
              </span>
              <span className="text-yellow-700 dark:text-yellow-400">
                {data.atRiskByLevel.medium} medium
              </span>
              <span className="text-green-700 dark:text-green-400">
                {data.atRiskByLevel.low} low
              </span>
            </div>
          )}
        </div>

        {/* Reminders Sent Today */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Reminders Sent Today</span>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data?.remindersSentToday || 0}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Upcoming Payments (7 days)</span>
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data?.upcomingPayments || 0}
          </div>
        </div>

        {/* Manual Update Button */}
        <button
          onClick={handleUpdatePaymentPlans}
          disabled={updating}
          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {updating ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4" />
              Update Payment Plans
            </>
          )}
        </button>
      </div>
    </div>
  )
}

