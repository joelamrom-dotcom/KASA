'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Pagination from '@/app/components/Pagination'
import TableImportExport from '@/app/components/TableImportExport'
import FilterBuilder, { FilterGroup } from '@/app/components/FilterBuilder'
import SavedViews from '@/app/components/SavedViews'
import QuickFilters from '@/app/components/QuickFilters'
import ViewSwitcher, { ViewType } from '@/app/components/ViewSwitcher'
import KanbanBoard from '@/app/components/KanbanBoard'
import CardView from '@/app/components/CardView'
import ListView from '@/app/components/ListView'
import { applyFilters } from '@/app/utils/filterUtils'
import { showToast } from '@/app/components/Toast'
import { useBulkSelection } from '@/app/hooks/useBulkSelection'
import BulkActionBar from '@/app/components/BulkActionBar'
import BulkEditModal from '@/app/components/BulkEditModal'

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [filters, setFilters] = useState({
    year: '',
    paymentMethod: '',
    type: '',
  })
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('table')

  // Define filter fields for payments
  const paymentFilterFields = [
    { id: 'amount', label: 'Amount', type: 'number' as const },
    { id: 'paymentDate', label: 'Payment Date', type: 'date' as const },
    { id: 'year', label: 'Year', type: 'number' as const },
    { 
      id: 'paymentMethod', 
      label: 'Payment Method', 
      type: 'select' as const,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'check', label: 'Check' },
        { value: 'quick_pay', label: 'Quick Pay' },
      ]
    },
    { 
      id: 'type', 
      label: 'Payment Type', 
      type: 'select' as const,
      options: [
        { value: 'membership', label: 'Membership' },
        { value: 'donation', label: 'Donation' },
        { value: 'other', label: 'Other' },
      ]
    },
  ]

  const applySearchFilter = () => {
    let filtered = [...allPayments]

    // Apply search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((payment) => {
        // Search by family name
        if (payment.familyId?.name?.toLowerCase().includes(searchTerm)) {
          return true
        }
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
        // Search by amount
        if (payment.amount.toString().includes(searchTerm)) {
          return true
        }
        return false
      })
    }

    // Apply advanced filters
    const advancedFiltered = applyFilters(filtered, filterGroups)
    setPayments(advancedFiltered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  useEffect(() => {
    fetchPayments()
  }, [filters.year, filters.paymentMethod, filters.type])

  useEffect(() => {
    // Apply search and advanced filters when they change or allPayments updates
    applySearchFilter()
  }, [searchQuery, filterGroups, allPayments])

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

  // Bulk selection (after payments are filtered)
  const bulkSelection = useBulkSelection({
    items: payments,
    getItemId: (item) => item._id,
  })

  // Bulk edit fields for payments
  const bulkEditFields = [
    { 
      id: 'type', 
      label: 'Payment Type', 
      type: 'select' as const,
      options: [
        { value: 'membership', label: 'Membership' },
        { value: 'donation', label: 'Donation' },
        { value: 'other', label: 'Other' },
      ]
    },
    { id: 'year', label: 'Year', type: 'number' as const },
    { id: 'notes', label: 'Notes', type: 'text' as const },
  ]

  // Bulk operation handlers
  const handleBulkUpdate = async (updates: Record<string, any>) => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/bulk/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'update',
          paymentIds: selectedIds,
          updates,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || 'Payments updated successfully', 'success')
        bulkSelection.clearSelection()
        fetchPayments()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update payments', 'error')
      }
    } catch (error) {
      console.error('Error updating payments:', error)
      showToast('Error updating payments', 'error')
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/bulk/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'delete',
          paymentIds: selectedIds,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || 'Payments deleted successfully', 'success')
        bulkSelection.clearSelection()
        fetchPayments()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete payments', 'error')
      }
    } catch (error) {
      console.error('Error deleting payments:', error)
      showToast('Error deleting payments', 'error')
    }
  }

  const handleBulkExport = async () => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/bulk/payments?ids=${selectedIds.join(',')}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        const data = await res.json()
        // Convert to CSV
        const headers = ['Date', 'Family', 'Amount', 'Type', 'Payment Method', 'Year', 'Notes']
        const csv = [
          headers.join(','),
          ...data.map((p: any) => [
            p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
            typeof p.familyId === 'object' ? p.familyId.name : 'Unknown',
            p.amount || 0,
            p.type || '',
            p.paymentMethod || '',
            p.year || '',
            p.notes || '',
          ].join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payments-export-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)

        showToast(`Exported ${data.length} payments`, 'success')
      }
    } catch (error) {
      console.error('Error exporting payments:', error)
      showToast('Error exporting payments', 'error')
    }
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
          <div className="flex items-center gap-4">
            <TableImportExport
              data={payments.map(p => ({
                ...p,
                familyName: typeof p.familyId === 'object' ? p.familyId.name : 'Unknown',
                paymentMethodLabel: paymentMethodLabels[p.paymentMethod],
                typeLabel: p.type.charAt(0).toUpperCase() + p.type.slice(1)
              }))}
              filename="payments"
              headers={[
                { key: 'familyName', label: 'Family Name' },
                { key: 'amount', label: 'Amount' },
                { key: 'paymentDate', label: 'Payment Date' },
                { key: 'year', label: 'Year' },
                { key: 'typeLabel', label: 'Type' },
                { key: 'paymentMethodLabel', label: 'Payment Method' },
                { key: 'notes', label: 'Notes' }
              ]}
            />
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-3xl font-bold text-green-600">${getTotalAmount().toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by family name, amount, date, card last 4, or check number..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="text-sm">Clear</span>
                </button>
              )}
            </div>
            <QuickFilters
              entityType="payment"
              onApplyFilter={(filters) => {
                setFilterGroups(filters)
                setCurrentPage(1)
                showToast('Quick filter applied', 'success')
              }}
            />
            <FilterBuilder
              fields={paymentFilterFields}
              filters={filterGroups}
              onChange={setFilterGroups}
              onApply={() => {
                setCurrentPage(1)
                showToast('Filters applied', 'success')
              }}
              onClear={() => {
                setFilterGroups([])
                setCurrentPage(1)
                showToast('Filters cleared', 'info')
              }}
            />
            <SavedViews
              entityType="payment"
              currentFilters={filterGroups}
              onLoadView={(filters) => {
                setFilterGroups(filters)
                setCurrentPage(1)
                showToast('View loaded', 'success')
              }}
            />
            <ViewSwitcher
              currentView={viewType}
              onViewChange={setViewType}
              availableViews={['table', 'kanban', 'card', 'list']}
            />
          </div>
          {(searchQuery || filterGroups.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                  Search: "{searchQuery}"
                </span>
              )}
              {filterGroups.length > 0 && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                  {filterGroups.reduce((sum, g) => sum + g.conditions.length, 0)} filter{filterGroups.reduce((sum, g) => sum + g.conditions.length, 0) !== 1 ? 's' : ''} active
                </span>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {payments.length} of {allPayments.length} {payments.length === 1 ? 'payment' : 'payments'}
              </span>
            </div>
          )}
        </div>

        {/* Payments Table */}
        <div className="glass-strong rounded-2xl shadow-xl overflow-hidden border border-white/30">
          {viewType === 'table' && (
            <>
            <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/20 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={bulkSelection.isAllSelected}
                    onChange={bulkSelection.toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = bulkSelection.isIndeterminate
                      }
                    }}
                  />
                </th>
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
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((payment) => {
                  const MethodIcon = paymentMethodIcons[payment.paymentMethod as keyof typeof paymentMethodIcons] || CurrencyDollarIcon
                  return (
                    <tr key={payment._id} className={`hover:bg-white/20 transition-colors ${bulkSelection.isSelected(payment._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={bulkSelection.isSelected(payment._id)}
                          onChange={() => bulkSelection.toggleSelection(payment._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
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
          {payments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(payments.length / itemsPerPage)}
              totalItems={payments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
            </>
          )}

          {viewType === 'kanban' && (
            <div className="p-6">
              <KanbanBoard
                items={payments}
                getItemId={(p) => p._id}
                getItemStatus={(p) => p.paymentMethod}
                columns={[
                  { id: 'credit_card', title: 'Credit Card', status: 'credit_card', color: 'blue' },
                  { id: 'check', title: 'Check', status: 'check', color: 'purple' },
                  { id: 'cash', title: 'Cash', status: 'cash', color: 'green' },
                  { id: 'quick_pay', title: 'Quick Pay', status: 'quick_pay', color: 'orange' },
                ]}
                renderItem={(payment) => {
                  const MethodIcon = paymentMethodIcons[payment.paymentMethod as keyof typeof paymentMethodIcons] || CurrencyDollarIcon
                  return (
                    <div>
                      <div className="font-semibold text-lg text-green-600">
                        ${payment.amount.toLocaleString()}
                      </div>
                      <Link href={`/families/${typeof payment.familyId === 'object' ? payment.familyId._id : ''}`} className="text-blue-600 hover:underline text-sm mt-1 block">
                        {typeof payment.familyId === 'object' ? payment.familyId.name : 'Unknown'}
                      </Link>
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <MethodIcon className="h-3 w-3" />
                          {formatPaymentMethod(payment)}
                        </div>
                        <div>{new Date(payment.paymentDate).toLocaleDateString()}</div>
                        <div className="capitalize">{payment.type}</div>
                      </div>
                    </div>
                  )
                }}
              />
            </div>
          )}

          {viewType === 'card' && (
            <div className="p-6">
              <CardView
                items={payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                columns={3}
                renderCard={(payment) => {
                  const MethodIcon = paymentMethodIcons[payment.paymentMethod as keyof typeof paymentMethodIcons] || CurrencyDollarIcon
                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-2xl font-bold text-green-600">
                          ${payment.amount.toLocaleString()}
                        </div>
                        <input
                          type="checkbox"
                          checked={bulkSelection.isSelected(payment._id)}
                          onChange={() => bulkSelection.toggleSelection(payment._id)}
                          className="rounded border-gray-300 text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <Link href={`/families/${typeof payment.familyId === 'object' ? payment.familyId._id : ''}`} className="text-blue-600 hover:underline font-medium block mb-2">
                        {typeof payment.familyId === 'object' ? payment.familyId.name : 'Unknown'}
                      </Link>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4" />
                          {formatPaymentMethod(payment)}
                        </div>
                        <div>{new Date(payment.paymentDate).toLocaleDateString()}</div>
                        <div className="capitalize">{payment.type}</div>
                        <div>Year: {payment.year}</div>
                        {payment.notes && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }}
              />
              {payments.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(payments.length / itemsPerPage)}
                  totalItems={payments.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}

          {viewType === 'list' && (
            <div className="p-6">
              <ListView
                items={payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                renderItem={(payment) => {
                  const MethodIcon = paymentMethodIcons[payment.paymentMethod as keyof typeof paymentMethodIcons] || CurrencyDollarIcon
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={bulkSelection.isSelected(payment._id)}
                          onChange={() => bulkSelection.toggleSelection(payment._id)}
                          className="rounded border-gray-300 text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="text-lg font-bold text-green-600 w-24">
                          ${payment.amount.toLocaleString()}
                        </div>
                        <Link href={`/families/${typeof payment.familyId === 'object' ? payment.familyId._id : ''}`} className="text-blue-600 hover:underline flex-1">
                          {typeof payment.familyId === 'object' ? payment.familyId.name : 'Unknown'}
                        </Link>
                        <span className="text-sm text-gray-600 w-32">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        <span className="text-sm text-gray-600 w-24 flex items-center gap-1">
                          <MethodIcon className="h-4 w-4" />
                          {formatPaymentMethod(payment)}
                        </span>
                        <span className="text-sm capitalize w-24">{payment.type}</span>
                        <span className="text-sm w-16">{payment.year}</span>
                      </div>
                    </div>
                  )
                }}
              />
              {payments.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(payments.length / itemsPerPage)}
                  totalItems={payments.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
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

