'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function DataQualityPage() {
  const [qualityData, setQualityData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQualityData()
  }, [])

  const fetchQualityData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/data-quality', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setQualityData(data)
      }
    } catch (error) {
      console.error('Error fetching quality data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 70) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  if (!qualityData) {
    return <div className="min-h-screen p-8">No data available</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Data Quality Dashboard
            </h1>
            <p className="text-gray-600">Monitor and improve your data quality</p>
          </div>
          <button
            onClick={fetchQualityData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {/* Quality Score */}
        <div className={`bg-white rounded-lg shadow p-8 mb-6 ${getScoreBg(qualityData.qualityScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Overall Quality Score</h2>
              <p className="text-gray-600">Based on data completeness and validity</p>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(qualityData.qualityScore)}`}>
                {qualityData.qualityScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">out of 100</div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Families</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{qualityData.metrics.totalFamilies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invalid Emails</span>
                <span className="text-red-600 font-semibold">{qualityData.metrics.invalidEmails}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Missing Emails</span>
                <span className="text-yellow-600 font-semibold">{qualityData.metrics.missingEmails}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invalid Phones</span>
                <span className="text-red-600 font-semibold">{qualityData.metrics.invalidPhones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Missing Names</span>
                <span className="text-red-600 font-semibold">{qualityData.metrics.missingNames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Missing Wedding Dates</span>
                <span className="text-red-600 font-semibold">{qualityData.metrics.missingWeddingDates}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Members</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{qualityData.metrics.totalMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Missing Birth Dates</span>
                <span className="text-yellow-600 font-semibold">{qualityData.metrics.missingBirthDates}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Payments</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{qualityData.metrics.totalPayments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {qualityData.issues && qualityData.issues.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Data Quality Issues</h3>
            <div className="space-y-3">
              {qualityData.issues.map((issue: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {issue.severity === 'high' ? (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    ) : issue.severity === 'medium' ? (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium">{issue.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                      <p className="text-sm text-gray-500">{issue.count} {issue.count === 1 ? 'record' : 'records'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

