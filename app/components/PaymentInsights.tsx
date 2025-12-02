'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface PaymentPattern {
  averageDaysToPay: number
  typicalPaymentDay: number | null
  typicalPaymentAmount: number | null
  paymentFrequency: 'consistent' | 'irregular' | 'declining' | 'improving'
  onTimeRate: number
  averageDaysLate: number
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
}

interface PaymentSuggestion {
  suggestedAmount: number | null
  suggestedDate: Date | null
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

interface PaymentInsightsProps {
  familyId: string
  familyName: string
  currentBalance?: number
}

export default function PaymentInsights({ familyId, familyName, currentBalance }: PaymentInsightsProps) {
  const [loading, setLoading] = useState(true)
  const [pattern, setPattern] = useState<PaymentPattern | null>(null)
  const [suggestions, setSuggestions] = useState<PaymentSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [familyId])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/payments/insights?familyId=${familyId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        const data = await res.json()
        setPattern(data.pattern)
        setSuggestions(data.suggestions)
      } else {
        setError('Failed to load payment insights')
      }
    } catch (err) {
      console.error('Error fetching payment insights:', err)
      setError('Error loading payment insights')
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      </div>
    )
  }

  if (!pattern) {
    return null
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'improving': return <TrendingUpIcon className="h-5 w-5 text-green-600" />
      case 'declining': return <TrendingDownIcon className="h-5 w-5 text-red-600" />
      default: return <ChartBarIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return `${day}th`
    switch (day % 10) {
      case 1: return `${day}st`
      case 2: return `${day}nd`
      case 3: return `${day}rd`
      default: return `${day}th`
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Pattern Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Payment Pattern Analysis
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(pattern.riskLevel)}`}>
            {pattern.riskLevel.toUpperCase()} Risk
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">On-Time Rate</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(pattern.onTimeRate)}%
            </div>
            {pattern.onTimeRate >= 90 && (
              <CheckCircleIcon className="h-4 w-4 text-green-600 mt-1" />
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Days Late</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pattern.averageDaysLate > 0 ? Math.round(pattern.averageDaysLate) : 0}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Frequency</div>
            <div className="flex items-center gap-2">
              {getFrequencyIcon(pattern.paymentFrequency)}
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {pattern.paymentFrequency}
              </span>
            </div>
          </div>

          {pattern.typicalPaymentDay && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Typical Payment Day</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getDaySuffix(pattern.typicalPaymentDay)}
              </div>
            </div>
          )}

          {pattern.typicalPaymentAmount && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Typical Amount</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(pattern.typicalPaymentAmount)}
              </div>
            </div>
          )}

          {currentBalance !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</div>
              <div className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(currentBalance)}
              </div>
            </div>
          )}
        </div>

        {pattern.suggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <InformationCircleIcon className="h-4 w-4" />
              Insights
            </h4>
            <ul className="space-y-2">
              {pattern.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Smart Payment Suggestions */}
      {suggestions && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-4">
            <LightBulbIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Smart Payment Suggestion
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              suggestions.confidence === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              suggestions.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {suggestions.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {suggestions.suggestedAmount && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Suggested Amount</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(suggestions.suggestedAmount)}
                </div>
              </div>
            )}

            {suggestions.suggestedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Suggested Date</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDate(suggestions.suggestedDate)}
                </div>
              </div>
            )}
          </div>

          {suggestions.reason && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Why this suggestion?</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{suggestions.reason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

