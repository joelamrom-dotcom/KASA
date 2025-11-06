'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

interface Payment {
  _id: string
  familyId: {
    _id: string
    name: string
    hebrewName?: string
    email?: string
    phone?: string
  }
  amount: number
  paymentDate: string
  year: number
  type: 'membership' | 'donation' | 'other'
  paymentMethod: 'cash' | 'credit_card' | 'check' | 'quick_pay'
  ccInfo?: {
    last4: string
    cardType: string
    expiryMonth: string
    expiryYear: string
    nameOnCard: string
  }
  checkInfo?: {
    checkNumber: string
    bankName: string
    routingNumber: string
  }
  notes?: string
  createdAt: string
}

const paymentMethodIcons = {
  cash: CurrencyDollarIcon,
  credit_card: CreditCardIcon,
  check: DocumentTextIcon,
  quick_pay: BoltIcon
}

const paymentMethodLabels = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  check: 'Check',
  quick_pay: 'Quick Pay'
}

const paymentMethodColors = {
  cash: 'bg-green-100 text-green-800',
  credit_card: 'bg-blue-100 text-blue-800',
  check: 'bg-purple-100 text-purple-800',
  quick_pay: 'bg-orange-100 text-orange-800'
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    year: '',
    paymentMethod: '',
    type: '',
    search: '' // Search by last 4 digits, check number, or date
  })

  const applyFilters = () => {
    let filtered = [...allPayments]

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter((payment) => {
        // Search by last 4 digits of credit card
        if (payment.ccInfo?.last4 && payment.ccInfo.last4.toLowerCase().includes(searchTerm)) {
          return true
        }
        // Search by check number
        if (payment.checkInfo?.checkNumber && payment.checkInfo.checkNumber.toLowerCase().includes(searchTerm)) {
          return true
        }
        // Search by date (format: MM/DD/YYYY or YYYY-MM-DD)
        const paymentDate = new Date(payment.paymentDate).toLocaleDateString()
        const isoDate = new Date(payment.paymentDate).toISOString().split('T')[0]
        if (paymentDate.includes(searchTerm) || isoDate.includes(searchTerm)) {
          return true
        }
        return false
      })
    }

    setPayments(filtered)
  }

  useEffect(() => {
    fetchPayments()
  }, [filters.year, filters.paymentMethod, filters.type])

  useEffect(() => {
    // Apply search filter when search term changes or allPayments updates
    applyFilters()
  }, [filters.search, allPayments])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.year) params.append('year', filters.year)
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod)
      if (filters.type) params.append('type', filters.type)

      const res = await fetch(`/api/kasa/payments?${params.toString()}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAllPayments(data)
        // The useEffect will automatically apply filters when allPayments updates
      } else {
        console.error('API error:', data)
        setAllPayments([])
        setPayments([])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const formatPaymentMethod = (payment: Payment) => {
    const paymentMethod = payment.paymentMethod || 'cash'
    const method = paymentMethodLabels[paymentMethod as keyof typeof paymentMethodLabels] || 'Cash'
    if (paymentMethod === 'credit_card' && payment.ccInfo) {
      return `${method} •••• ${payment.ccInfo.last4}`
    }
    if (paymentMethod === 'check' && payment.checkInfo) {
      return `${method} #${payment.checkInfo.checkNumber}`
    }
    return method
  }

  const getTotalAmount = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getCurrentYear = () => {
    return new Date().getFullYear()
  }

  const getAvailableYears = () => {
    const years = new Set<number>()
    payments.forEach(payment => {
      if (payment.year) years.add(payment.year)
    })
    return Array.from(years).sort((a, b) => b - a)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              All Payments
            </h1>
            <p className="text-gray-600">View and manage all payments across all families</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-3xl font-bold text-green-600">${getTotalAmount().toLocaleString()}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6 border border-white/30">
          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by last 4 digits, check number, or date (MM/DD/YYYY)"
              className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Search by credit card last 4 digits, check number, or payment date
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">All Years</option>
                {getAvailableYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="check">Check</option>
                <option value="quick_pay">Quick Pay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">All Types</option>
                <option value="membership">Membership</option>
                <option value="donation">Donation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="glass-strong rounded-2xl shadow-xl overflow-hidden border border-white/30">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/20 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-white/20">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const MethodIcon = paymentMethodIcons[payment.paymentMethod as keyof typeof paymentMethodIcons] || CurrencyDollarIcon
                  return (
                    <tr key={payment._id} className="hover:bg-white/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {payment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatPaymentMethod(payment)}</span>
                        </div>
                        {payment.paymentMethod === 'credit_card' && payment.ccInfo?.cardType && (
                          <div className="text-xs text-gray-500 mt-1">{payment.ccInfo.cardType}</div>
                        )}
                        {payment.paymentMethod === 'check' && payment.checkInfo?.bankName && (
                          <div className="text-xs text-gray-500 mt-1">{payment.checkInfo.bankName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.year}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {payment.notes || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="glass-strong rounded-xl p-4 border border-white/30">
            <div className="text-sm text-gray-600">Total Payments</div>
            <div className="text-2xl font-bold">{payments.length}</div>
          </div>
          <div className="glass-strong rounded-xl p-4 border border-white/30">
            <div className="text-sm text-gray-600">Cash Payments</div>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter(p => p.paymentMethod === 'cash').length}
            </div>
          </div>
          <div className="glass-strong rounded-xl p-4 border border-white/30">
            <div className="text-sm text-gray-600">Credit Card Payments</div>
            <div className="text-2xl font-bold text-blue-600">
              {payments.filter(p => p.paymentMethod === 'credit_card').length}
            </div>
          </div>
          <div className="glass-strong rounded-xl p-4 border border-white/30">
            <div className="text-sm text-gray-600">Check Payments</div>
            <div className="text-2xl font-bold text-purple-600">
              {payments.filter(p => p.paymentMethod === 'check').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

