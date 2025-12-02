'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface DuplicateMatch {
  family1: any
  family2: any
  confidence: number
  matchReasons: string[]
  differences: Array<{ field: string; value1: any; value2: any }>
}

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPair, setSelectedPair] = useState<DuplicateMatch | null>(null)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergePreview, setMergePreview] = useState<any>(null)
  const [resolutions, setResolutions] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    fetchDuplicates()
  }, [])

  const fetchDuplicates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/duplicates/detect', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setDuplicates(data.duplicates || [])
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewMerge = async (pair: DuplicateMatch) => {
    try {
      setSelectedPair(pair)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/duplicates/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          family1Id: pair.family1._id,
          family2Id: pair.family2._id,
          action: 'preview'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setMergePreview(data.preview)
        setShowMergeModal(true)
      }
    } catch (error) {
      console.error('Error previewing merge:', error)
    }
  }

  const handleMerge = async () => {
    if (!selectedPair) return

    if (!confirm('Are you sure you want to merge these families? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/duplicates/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          family1Id: selectedPair.family1._id,
          family2Id: selectedPair.family2._id,
          resolutions,
          action: 'merge'
        })
      })
      if (res.ok) {
        alert('Families merged successfully!')
        setShowMergeModal(false)
        setSelectedPair(null)
        setMergePreview(null)
        setResolutions({})
        fetchDuplicates()
      }
    } catch (error) {
      console.error('Error merging families:', error)
      alert('Failed to merge families')
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading duplicates...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Duplicate Detection
            </h1>
            <p className="text-gray-600">Find and merge duplicate family records</p>
          </div>
          <button
            onClick={fetchDuplicates}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {duplicates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Duplicates Found</h2>
            <p className="text-gray-600">Your database is clean! No duplicate families detected.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {duplicates.map((duplicate, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        duplicate.confidence >= 90 ? 'bg-red-100 text-red-700' :
                        duplicate.confidence >= 80 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {duplicate.confidence}% Match
                      </span>
                      <div className="flex gap-2">
                        {duplicate.matchReasons.map((reason, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Family 1</h3>
                        <p className="text-sm text-gray-700">{duplicate.family1.name}</p>
                        <p className="text-xs text-gray-500">{duplicate.family1.email || 'No email'}</p>
                        <p className="text-xs text-gray-500">{duplicate.family1.phone || 'No phone'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Family 2</h3>
                        <p className="text-sm text-gray-700">{duplicate.family2.name}</p>
                        <p className="text-xs text-gray-500">{duplicate.family2.email || 'No email'}</p>
                        <p className="text-xs text-gray-500">{duplicate.family2.phone || 'No phone'}</p>
                      </div>
                    </div>
                    {duplicate.differences.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded">
                        <p className="text-xs font-medium text-yellow-800 mb-1">Differences:</p>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {duplicate.differences.map((diff, i) => (
                            <li key={i}>
                              <strong>{diff.field}:</strong> "{diff.value1}" vs "{diff.value2}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handlePreviewMerge(duplicate)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Merge Modal */}
        {showMergeModal && mergePreview && selectedPair && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Merge Preview</h2>
                <button
                  onClick={() => {
                    setShowMergeModal(false)
                    setMergePreview(null)
                    setResolutions({})
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Merge Statistics</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Members</p>
                      <p className="text-xl font-bold">{mergePreview.stats.totalMembers}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payments</p>
                      <p className="text-xl font-bold">{mergePreview.stats.totalPayments}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Events</p>
                      <p className="text-xl font-bold">{mergePreview.stats.totalEvents}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold">${mergePreview.stats.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {mergePreview.conflicts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Resolve Conflicts</h3>
                    <div className="space-y-3">
                      {mergePreview.conflicts.map((conflict: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2">{conflict.field}</label>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Family 1</p>
                              <p className="text-sm">{conflict.value1 || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Family 2</p>
                              <p className="text-sm">{conflict.value2 || 'N/A'}</p>
                            </div>
                          </div>
                          <select
                            value={resolutions[conflict.field] || 'keep1'}
                            onChange={(e) => {
                              setResolutions({
                                ...resolutions,
                                [conflict.field]: e.target.value
                              })
                            }}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="keep1">Keep Family 1 Value</option>
                            <option value="keep2">Keep Family 2 Value</option>
                            <option value="merge">Merge Values</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-end pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowMergeModal(false)
                      setMergePreview(null)
                      setResolutions({})
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMerge}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Confirm Merge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

