'use client'

import { useState, useEffect } from 'react'
import { ArrowDownIcon, XMarkIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface DrillDownResult {
  sourceField: string
  sourceValue: any
  records: any[]
  relatedRecords?: any[]
  totalCount: number
  targetReport?: any
  filters?: any[]
}

interface ReportDrillDownProps {
  reportId: string
  sourceField: string
  sourceValue: any
  onClose: () => void
  onNavigate?: (reportId: string, filters: any[]) => void
}

export default function ReportDrillDown({
  reportId,
  sourceField,
  sourceValue,
  onClose,
  onNavigate,
}: ReportDrillDownProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<DrillDownResult | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Array<{ field: string; value: any }>>([
    { field: sourceField, value: sourceValue },
  ])

  useEffect(() => {
    executeDrillDown()
  }, [reportId, sourceField, sourceValue])

  const executeDrillDown = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/drill-down`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceField,
          sourceValue,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data.result)
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to execute drill-down'}`)
      }
    } catch (error) {
      console.error('Error executing drill-down:', error)
      alert('Failed to execute drill-down')
    } finally {
      setLoading(false)
    }
  }

  const handleDrillDown = async (field: string, value: any) => {
    setBreadcrumb([...breadcrumb, { field, value }])
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/drill-down`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceField: field,
          sourceValue: value,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data.result)
      }
    } catch (error) {
      console.error('Error drilling down:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToReport = () => {
    if (result?.targetReport && result.filters && onNavigate) {
      onNavigate(result.targetReport._id, result.filters)
      onClose()
    }
  }

  const goBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1)
      setBreadcrumb(newBreadcrumb)
      const last = newBreadcrumb[newBreadcrumb.length - 1]
      handleDrillDown(last.field, last.value)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <ArrowDownIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Drill-Down Details</h3>
              {breadcrumb.length > 1 && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  {breadcrumb.map((crumb, index) => (
                    <span key={index}>
                      {index > 0 && <span className="mx-1">→</span>}
                      <span>{crumb.field}: {String(crumb.value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {breadcrumb.length > 1 && (
              <button
                onClick={goBack}
                className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1 text-sm"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading drill-down data...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Found {result.totalCount} record(s)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {sourceField}: {String(sourceValue)}
                    </p>
                  </div>
                  {result.targetReport && (
                    <button
                      onClick={handleNavigateToReport}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View in Report
                    </button>
                  )}
                </div>
              </div>

              {/* Records Table */}
              {result.records && result.records.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Records</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(result.records[0]).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                {key}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.records.map((record: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {Object.keys(result.records[0]).map((key) => (
                                <td
                                  key={key}
                                  className="px-4 py-3 text-sm text-gray-900"
                                >
                                  {typeof record[key] === 'object'
                                    ? JSON.stringify(record[key])
                                    : String(record[key] || '-')}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-sm">
                                <button
                                  onClick={() => {
                                    // Find a clickable field (ID or similar)
                                    const idField = Object.keys(record).find(
                                      (k) => k.toLowerCase().includes('id') || k === '_id'
                                    )
                                    if (idField) {
                                      handleDrillDown(idField, record[idField])
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <MagnifyingGlassIcon className="h-4 w-4" />
                                  Drill Down
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Records */}
              {result.relatedRecords && result.relatedRecords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Related Records</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.relatedRecords.map((related: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {related.type}
                        </div>
                        <div className="text-sm text-gray-600">
                          {JSON.stringify(related.record, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!result.records || result.records.length === 0) &&
                (!result.relatedRecords || result.relatedRecords.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No records found for this drill-down.</p>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No drill-down data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

