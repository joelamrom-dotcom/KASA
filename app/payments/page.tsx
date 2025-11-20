'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  CalendarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'
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

type PaymentTab = 'all' | 'overdue' | 'links' | 'analytics'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>('all')
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
  
  // Overdue payments state
  const [overduePayments, setOverduePayments] = useState<any[]>([])
  const [overdueStats, setOverdueStats] = useState<any>(null)
  const [overdueLoading, setOverdueLoading] = useState(false)
  const [overdueFilter, setOverdueFilter] = useState<'all' | 'level1' | 'level2' | 'level3'>('all')
  
  // Payment links state
  const [links, setLinks] = useState<any[]>([])
  const [families, setFamilies] = useState<any[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [linkFormData, setLinkFormData] = useState<any>({
    familyId: '',
    amount: undefined,
    description: '',
    paymentPlan: { enabled: false },
    expiresAt: '',
    maxUses: undefined
  })
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30')

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
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* All Payments Tab */}
        {activeTab === 'all' && (
          <>
          <div className="flex justify-between items-center mb-6">
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
          </>
        )}

        {/* Overdue Payments Tab */}
        {activeTab === 'overdue' && (
          <div className="space-y-6">
            {/* Statistics */}
            {overdueStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-strong rounded-xl shadow-lg p-6 border border-white/30">
                  <div className="text-sm text-gray-600 mb-1">Total Overdue</div>
                  <div className="text-3xl font-bold text-gray-800">{overdueStats.total}</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-lg p-6 border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">7-13 Days</div>
                  <div className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">{overdueStats.byLevel.level1}</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl shadow-lg p-6 border-2 border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">14-29 Days</div>
                  <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">{overdueStats.byLevel.level2}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-lg p-6 border-2 border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-700 dark:text-red-300 mb-1">30+ Days</div>
                  <div className="text-3xl font-bold text-red-800 dark:text-red-200">{overdueStats.byLevel.level3}</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="glass-strong rounded-xl shadow-xl p-6 border border-white/30">
              <div className="flex gap-2 flex-wrap">
                {['all', 'level1', 'level2', 'level3'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setOverdueFilter(filter as any)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      overdueFilter === filter
                        ? filter === 'all' ? 'bg-purple-600 text-white' :
                          filter === 'level1' ? 'bg-yellow-600 text-white' :
                          filter === 'level2' ? 'bg-orange-600 text-white' :
                          'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter === 'all' ? 'All Overdue' :
                     filter === 'level1' ? '7-13 Days' :
                     filter === 'level2' ? '14-29 Days' :
                     '30+ Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Overdue Payments Table */}
            <div className="glass-strong rounded-xl shadow-xl p-6 border border-white/30">
              {overdueLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading overdue payments...</p>
                </div>
              ) : (overdueFilter === 'all' ? overduePayments : overdueFilter === 'level1' 
                ? overduePayments.filter((p: any) => p.daysOverdue >= 7 && p.daysOverdue < 14)
                : overdueFilter === 'level2'
                ? overduePayments.filter((p: any) => p.daysOverdue >= 14 && p.daysOverdue < 30)
                : overduePayments.filter((p: any) => p.daysOverdue >= 30)
              ).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No overdue payments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Family</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Days Overdue</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Payment Method</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(overdueFilter === 'all' ? overduePayments : overdueFilter === 'level1' 
                        ? overduePayments.filter((p: any) => p.daysOverdue >= 7 && p.daysOverdue < 14)
                        : overdueFilter === 'level2'
                        ? overduePayments.filter((p: any) => p.daysOverdue >= 14 && p.daysOverdue < 30)
                        : overduePayments.filter((p: any) => p.daysOverdue >= 30)
                      ).map((payment: any) => (
                        <tr key={payment._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <Link
                              href={`/families/${payment.familyId._id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline"
                            >
                              {payment.familyId.name}
                            </Link>
                            {payment.familyId.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{payment.familyId.email}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-red-600 dark:text-red-400">
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(payment.nextPaymentDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              payment.daysOverdue >= 30 ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                              payment.daysOverdue >= 14 ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                              'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                            }`}>
                              {payment.daysOverdue} {payment.daysOverdue === 1 ? 'day' : 'days'} overdue
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {payment.savedPaymentMethodId?.cardType || 'N/A'} •••• {payment.savedPaymentMethodId?.last4 || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/families/${payment.familyId._id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
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
        )}

        {/* Payment Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-6">
            {linkMessage && (
              <div className={`p-4 rounded-lg ${
                linkMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                {linkMessage.text}
              </div>
            )}

            <div className="glass-strong rounded-xl shadow-lg p-6 border border-white/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Payment Links</h2>
                <button
                  onClick={() => {
                    setEditingLink(null)
                    setLinkFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                    setShowLinkModal(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Payment Link
                </button>
              </div>

              {linksLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : links.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <LinkIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No payment links found. Create your first payment link to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => (
                    <div
                      key={link._id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{link.familyName || 'Unknown Family'}</h3>
                            {link.isActive ? (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">Active</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs rounded-full">Inactive</span>
                            )}
                          </div>
                          {link.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{link.description}</p>
                          )}
                          {link.amount && (
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">${link.amount.toLocaleString()}</p>
                          )}
                          {link.linkUrl && (
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                readOnly
                                value={link.linkUrl}
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(link.linkUrl!)
                                  setLinkMessage({ type: 'success', text: 'Link copied to clipboard!' })
                                  setTimeout(() => setLinkMessage(null), 3000)
                                }}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Copy link"
                              >
                                <DocumentDuplicateIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {link.expiresAt && (
                              <span>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                            )}
                            {link.maxUses && (
                              <span>Uses: {link.currentUses || 0} / {link.maxUses}</span>
                            )}
                            {link.paymentPlan?.enabled && (
                              <span>Payment Plan: {link.paymentPlan.installments} installments ({link.paymentPlan.frequency})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingLink(link)
                              setLinkFormData({
                                familyId: link.familyId,
                                amount: link.amount,
                                description: link.description,
                                paymentPlan: link.paymentPlan || { enabled: false },
                                expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : '',
                                maxUses: link.maxUses
                              })
                              setShowLinkModal(true)
                            }}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Are you sure you want to delete this payment link?')) return
                              try {
                                const token = localStorage.getItem('token')
                                const res = await fetch(`/api/kasa/payment-links?id=${link._id}`, {
                                  method: 'DELETE',
                                  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                })
                                if (res.ok) {
                                  setLinkMessage({ type: 'success', text: 'Payment link deleted successfully!' })
                                  fetchLinks()
                                } else {
                                  const error = await res.json()
                                  setLinkMessage({ type: 'error', text: error.error || 'Failed to delete payment link' })
                                }
                              } catch (error) {
                                setLinkMessage({ type: 'error', text: 'Failed to delete payment link' })
                              }
                            }}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Link Modal */}
            {showLinkModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{editingLink ? 'Edit Payment Link' : 'Create New Payment Link'}</h2>
                    <button
                      onClick={() => {
                        setShowLinkModal(false)
                        setEditingLink(null)
                        setLinkFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    try {
                      const token = localStorage.getItem('token')
                      const res = await fetch('/api/kasa/payment-links', {
                        method: editingLink ? 'PUT' : 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                          ...linkFormData,
                          _id: editingLink?._id,
                          amount: linkFormData.amount ? parseFloat(linkFormData.amount.toString()) : undefined,
                          maxUses: linkFormData.maxUses ? parseInt(linkFormData.maxUses.toString()) : undefined
                        })
                      })

                      if (res.ok) {
                        setLinkMessage({ type: 'success', text: editingLink ? 'Payment link updated successfully!' : 'Payment link created successfully!' })
                        setShowLinkModal(false)
                        setEditingLink(null)
                        setLinkFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                        fetchLinks()
                      } else {
                        const error = await res.json()
                        setLinkMessage({ type: 'error', text: error.error || 'Failed to save payment link' })
                      }
                    } catch (error) {
                      setLinkMessage({ type: 'error', text: 'Failed to save payment link' })
                    }
                  }} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family *</label>
                      <select
                        required
                        value={linkFormData.familyId}
                        onChange={(e) => setLinkFormData({ ...linkFormData, familyId: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select a family</option>
                        {families.map((family) => (
                          <option key={family._id} value={family._id}>{family.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (optional - leave empty for custom amount)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={linkFormData.amount || ''}
                        onChange={(e) => setLinkFormData({ ...linkFormData, amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        value={linkFormData.description || ''}
                        onChange={(e) => setLinkFormData({ ...linkFormData, description: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        rows={3}
                        placeholder="Payment description..."
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={linkFormData.paymentPlan?.enabled || false}
                          onChange={(e) => setLinkFormData({
                            ...linkFormData,
                            paymentPlan: { ...linkFormData.paymentPlan, enabled: e.target.checked } as any
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Payment Plan</span>
                      </label>
                      {linkFormData.paymentPlan?.enabled && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Installments</label>
                            <input
                              type="number"
                              value={linkFormData.paymentPlan.installments || ''}
                              onChange={(e) => setLinkFormData({
                                ...linkFormData,
                                paymentPlan: { ...linkFormData.paymentPlan, installments: parseInt(e.target.value) } as any
                              })}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              min="2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                            <select
                              value={linkFormData.paymentPlan.frequency || 'monthly'}
                              onChange={(e) => setLinkFormData({
                                ...linkFormData,
                                paymentPlan: { ...linkFormData.paymentPlan, frequency: e.target.value } as any
                              })}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            >
                              <option value="weekly">Weekly</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date (optional)</label>
                      <input
                        type="date"
                        value={linkFormData.expiresAt || ''}
                        onChange={(e) => setLinkFormData({ ...linkFormData, expiresAt: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Uses (optional)</label>
                      <input
                        type="number"
                        value={linkFormData.maxUses || ''}
                        onChange={(e) => setLinkFormData({ ...linkFormData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        min="1"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkModal(false)
                          setEditingLink(null)
                          setLinkFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingLink ? 'Update Link' : 'Create Link'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
              <select
                value={analyticsPeriod}
                onChange={(e) => setAnalyticsPeriod(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading analytics...</p>
              </div>
            ) : !analytics ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No analytics data available
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{analytics.totals.totalPayments}</p>
                      </div>
                      <ChartBarIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">${analytics.totals.totalAmount.toLocaleString()}</p>
                      </div>
                      <CurrencyDollarIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Average Amount</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">${analytics.totals.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                      <ArrowTrendingUpIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>

                  <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                          {analytics.totals.totalPayments > 0 
                            ? ((analytics.totals.successfulPayments / analytics.totals.totalPayments) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <ChartBarIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Payment Methods</h2>
                  <div className="space-y-3">
                    {Object.entries(analytics.totals.byMethod).map(([method, data]: [string, any]) => (
                      <div key={method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{method.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{data.count} payments</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">${data.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Types Breakdown */}
                <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Payment Types</h2>
                  <div className="space-y-3">
                    {Object.entries(analytics.totals.byType).map(([type, data]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{data.count} payments</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">${data.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Trends */}
                {analytics.totals.trends.length > 0 && (
                  <div className="glass-strong rounded-lg shadow-lg p-6 border border-white/30">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Daily Trends</h2>
                    <div className="space-y-2">
                      {analytics.totals.trends.slice(-14).map((trend: any) => (
                        <div key={trend.date} className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(trend.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{trend.count} payments</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">${trend.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

