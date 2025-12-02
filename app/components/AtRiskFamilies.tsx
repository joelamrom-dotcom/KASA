'use client'

import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface AtRiskFamily {
  familyId: string
  familyName: string
  riskLevel: 'low' | 'medium' | 'high'
  reasons: string[]
  currentBalance: number
  daysOverdue: number
}

interface AtRiskFamiliesProps {
  onFamilyClick?: (familyId: string) => void
}

export default function AtRiskFamilies({ onFamilyClick }: AtRiskFamiliesProps) {
  const [loading, setLoading] = useState(true)
  const [families, setFamilies] = useState<AtRiskFamily[]>([])
  const [stats, setStats] = useState<{
    total: number
    byRiskLevel: { high: number; medium: number; low: number }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    fetchAtRiskFamilies()
  }, [])

  const fetchAtRiskFamilies = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/insights', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        const data = await res.json()
        setFamilies(data.atRiskFamilies || [])
        setStats({
          total: data.total || 0,
          byRiskLevel: data.byRiskLevel || { high: 0, medium: 0, low: 0 }
        })
      } else {
        setError('Failed to load at-risk families')
      }
    } catch (err) {
      console.error('Error fetching at-risk families:', err)
      setError('Error loading at-risk families')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getRiskIcon = (risk: string) => {
    if (risk === 'high') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
    }
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const filteredFamilies = filter === 'all' 
    ? families
    : families.filter(f => f.riskLevel === filter)

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            At-Risk Families
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Families that may need attention based on payment patterns
          </p>
        </div>
        <button
          onClick={fetchAtRiskFamilies}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total At-Risk</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-400 mb-1">High Risk</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.byRiskLevel.high}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Medium Risk</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.byRiskLevel.medium}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-400 mb-1">Low Risk</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.byRiskLevel.low}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All ({families.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'high'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          High ({stats?.byRiskLevel.high || 0})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'medium'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Medium ({stats?.byRiskLevel.medium || 0})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'low'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Low ({stats?.byRiskLevel.low || 0})
        </button>
      </div>

      {/* Families List */}
      {filteredFamilies.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' 
              ? 'No at-risk families found. Great job!'
              : `No ${filter} risk families found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFamilies.map((family) => (
            <div
              key={family.familyId}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getRiskColor(family.riskLevel)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getRiskIcon(family.riskLevel)}
                    <Link
                      href={`/families/${family.familyId}`}
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                      onClick={(e) => {
                        if (onFamilyClick) {
                          e.preventDefault()
                          onFamilyClick(family.familyId)
                        }
                      }}
                    >
                      {family.familyName}
                    </Link>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(family.riskLevel)}`}>
                      {family.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Current Balance</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(family.currentBalance)}
                      </div>
                    </div>
                    {family.daysOverdue > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Days Overdue</div>
                        <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {family.daysOverdue} days
                        </div>
                      </div>
                    )}
                  </div>

                  {family.reasons.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Factors:</div>
                      <ul className="space-y-1">
                        {family.reasons.map((reason, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Link
                  href={`/families/${family.familyId}`}
                  className="ml-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="View Family"
                >
                  <LinkIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

