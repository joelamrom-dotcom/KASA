'use client'

import { useState, useEffect } from 'react'
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline'

interface PaymentPlanHistoryItem {
  _id: string
  date: string
  memberName: string
  memberId: string
  oldPlan: number | null
  newPlan: number | null
  changedBy: string
  changedByRole: string
  reason: string
  description: string
}

interface PaymentPlanHistoryProps {
  familyId: string
}

export default function PaymentPlanHistory({ familyId }: PaymentPlanHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<PaymentPlanHistoryItem[]>([])

  useEffect(() => {
    fetchHistory()
  }, [familyId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/families/${familyId}/payment-plan-history`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching payment plan history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'automatic_age_based_update': 'Automatic (Age-based)',
      'manual_update': 'Manual Update',
      'system': 'System'
    }
    return labels[reason] || reason
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p>No payment plan changes recorded</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Payment Plan Change History</h3>
          <p className="text-sm text-gray-600 mt-1">Track all payment plan changes for family members</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      {item.memberName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {item.oldPlan ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Plan {item.oldPlan}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                          None
                        </span>
                      )}
                      <span className="text-gray-400">→</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Plan {item.newPlan}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div>
                      <div className="font-medium">{item.changedBy}</div>
                      <div className="text-xs text-gray-500 capitalize">{item.changedByRole}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.reason === 'automatic_age_based_update'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getReasonLabel(item.reason)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

