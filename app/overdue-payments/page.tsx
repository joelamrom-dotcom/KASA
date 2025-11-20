'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OverduePayment {
  _id: string
  familyId: {
    _id: string
    name: string
    email?: string
    husbandCellPhone?: string
    wifeCellPhone?: string
    phone?: string
  }
  savedPaymentMethodId: {
    last4: string
    cardType: string
  }
  amount: number
  nextPaymentDate: string
  daysOverdue: number
  isOverdue: boolean
  reminderLevel: number
  lastReminderSent?: string
}

interface OverdueStats {
  total: number
  byLevel: {
    level1: number
    level2: number
    level3: number
  }
  totalAmount: number
  averageDaysOverdue: number
}

export default function OverduePaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<OverduePayment[]>([])
  const [stats, setStats] = useState<OverdueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'level1' | 'level2' | 'level3'>('all')

  useEffect(() => {
    fetchOverduePayments()
  }, [filter])

  const fetchOverduePayments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (filter === 'level1') params.append('minDaysOverdue', '7')
      else if (filter === 'level2') params.append('minDaysOverdue', '14')
      else if (filter === 'level3') params.append('minDaysOverdue', '30')

      const res = await fetch(`/api/kasa/payments/overdue?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching overdue payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOverdueBadgeColor = (daysOverdue: number) => {
    if (daysOverdue >= 30) return 'bg-red-100 text-red-800 border-red-300'
    if (daysOverdue >= 14) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (daysOverdue >= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getOverdueBadgeText = (daysOverdue: number) => {
    if (daysOverdue === 1) return '1 day overdue'
    if (daysOverdue < 7) return `${daysOverdue} days overdue`
    if (daysOverdue < 14) return `${daysOverdue} days overdue`
    if (daysOverdue < 30) return `${daysOverdue} days overdue`
    return `${daysOverdue}+ days overdue`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredPayments = filter === 'all' 
    ? payments
    : filter === 'level1'
    ? payments.filter(p => p.daysOverdue >= 7 && p.daysOverdue < 14)
    : filter === 'level2'
    ? payments.filter(p => p.daysOverdue >= 14 && p.daysOverdue < 30)
    : payments.filter(p => p.daysOverdue >= 30)

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Overdue Payments</h1>
          <p className="text-gray-600">Track and manage payments that are past due</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Overdue</div>
              <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl shadow-lg p-6 border-2 border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">7-13 Days</div>
              <div className="text-3xl font-bold text-yellow-800">{stats.byLevel.level1}</div>
            </div>
            <div className="bg-orange-50 rounded-xl shadow-lg p-6 border-2 border-orange-200">
              <div className="text-sm text-orange-700 mb-1">14-29 Days</div>
              <div className="text-3xl font-bold text-orange-800">{stats.byLevel.level2}</div>
            </div>
            <div className="bg-red-50 rounded-xl shadow-lg p-6 border-2 border-red-200">
              <div className="text-sm text-red-700 mb-1">30+ Days</div>
              <div className="text-3xl font-bold text-red-800">{stats.byLevel.level3}</div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Amount Overdue</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Average Days Overdue</div>
                <div className="text-2xl font-bold text-gray-800">{Math.round(stats.averageDaysOverdue)} days</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Reminders Sent</div>
                <div className="text-2xl font-bold text-gray-800">
                  {payments.filter(p => p.lastReminderSent).length} / {payments.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Overdue
            </button>
            <button
              onClick={() => setFilter('level1')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'level1'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7-13 Days
            </button>
            <button
              onClick={() => setFilter('level2')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'level2'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              14-29 Days
            </button>
            <button
              onClick={() => setFilter('level3')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'level3'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30+ Days
            </button>
          </div>
        </div>

        {/* Overdue Payments Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading overdue payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No overdue payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Family</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Days Overdue</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Reminder</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/families/${payment.familyId._id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {payment.familyId.name}
                        </Link>
                        {payment.familyId.email && (
                          <div className="text-xs text-gray-500 mt-1">{payment.familyId.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-red-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(payment.nextPaymentDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getOverdueBadgeColor(payment.daysOverdue)}`}>
                          {getOverdueBadgeText(payment.daysOverdue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {payment.savedPaymentMethodId?.cardType || 'N/A'} •••• {payment.savedPaymentMethodId?.last4 || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {payment.lastReminderSent 
                          ? formatDate(payment.lastReminderSent)
                          : <span className="text-gray-400">Not sent</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/families/${payment.familyId._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Family →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

