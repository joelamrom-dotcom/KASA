'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Pagination from '@/app/components/Pagination'
import { showToast } from '@/app/components/Toast'
import ConfirmationDialog from '@/app/components/ConfirmationDialog'
import { TableSkeleton } from '@/app/components/LoadingSkeleton'
import EmptyState from '@/app/components/EmptyState'
import TableImportExport from '@/app/components/TableImportExport'
import FilterBuilder, { FilterGroup } from '@/app/components/FilterBuilder'
import SavedViews from '@/app/components/SavedViews'
import QuickFilters from '@/app/components/QuickFilters'
import ViewSwitcher, { ViewType } from '@/app/components/ViewSwitcher'
import KanbanBoard from '@/app/components/KanbanBoard'
import CardView from '@/app/components/CardView'
import ListView from '@/app/components/ListView'
import { applyFilters } from '@/app/utils/filterUtils'
import { useBulkSelection } from '@/app/hooks/useBulkSelection'
import BulkActionBar from '@/app/components/BulkActionBar'
import BulkEditModal from '@/app/components/BulkEditModal'
import BulkTagModal from '@/app/components/BulkTagModal'
import BulkMessageModal from '@/app/components/BulkMessageModal'

// QWERTY to Hebrew keyboard mapping
const qwertyToHebrew: { [key: string]: string } = {
  // Lowercase letters
  'q': '/', 'w': "'", 'e': 'ק', 'r': 'ר', 't': 'א', 'y': 'ט', 'u': 'ו', 'i': 'ן', 'o': 'ם', 'p': 'פ',
  'a': 'ש', 's': 'ד', 'd': 'ג', 'f': 'כ', 'g': 'ע', 'h': 'י', 'j': 'ח', 'k': 'ל', 'l': 'ך',
  'z': 'ז', 'x': 'ס', 'c': 'ב', 'v': 'ה', 'b': 'נ', 'n': 'מ', 'm': 'צ',
  // Uppercase letters (with Shift)
  'Q': '/', 'W': "'", 'E': 'ק', 'R': 'ר', 'T': 'א', 'Y': 'ט', 'U': 'ו', 'I': 'ן', 'O': 'ם', 'P': 'פ',
  'A': 'ש', 'S': 'ד', 'D': 'ג', 'F': 'כ', 'G': 'ע', 'H': 'י', 'J': 'ח', 'K': 'ל', 'L': 'ך',
  'Z': 'ז', 'X': 'ס', 'C': 'ב', 'V': 'ה', 'B': 'נ', 'N': 'מ', 'M': 'צ',
  // Numbers and special characters
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  '-': '-', '=': '=', '[': ']', ']': '[', '\\': '\\', ';': 'ף', "'": ',', ',': 'ת', '.': 'ץ', '/': '.',
  ' ': ' ' // Space
}

// Convert QWERTY input to Hebrew characters
const convertToHebrew = (text: string): string => {
  return text.split('').map(char => qwertyToHebrew[char] || char).join('')
}

// Handler for Hebrew input fields
const handleHebrewInput = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string, setValue: (value: string) => void) => {
  const input = e.currentTarget
  const cursorPosition = input.selectionStart || 0
  
  // Only convert if typing a regular character (not special keys like Backspace, Delete, Arrow keys, etc.)
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    const hebrewChar = qwertyToHebrew[e.key] || e.key
    const newValue = currentValue.slice(0, cursorPosition) + hebrewChar + currentValue.slice(cursorPosition)
    setValue(newValue)
    
    // Set cursor position after the inserted character
    setTimeout(() => {
      input.setSelectionRange(cursorPosition + 1, cursorPosition + 1)
    }, 0)
  }
}

// Helper function to capitalize first letter of each word
const capitalizeName = (text: string): string => {
  if (!text) return text
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper function to format phone number (numbers only)
const formatPhone = (value: string): string => {
  // Remove all non-numeric characters
  return value.replace(/\D/g, '')
}

// Helper function to validate email format
const validateEmail = (email: string): boolean => {
  if (!email) return true // Empty is valid (optional field)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface Family {
  _id: string
  name: string
  hebrewName?: string
  weddingDate: string
  husbandFirstName?: string
  husbandHebrewName?: string
  husbandFatherHebrewName?: string
  wifeFirstName?: string
  wifeHebrewName?: string
  wifeFatherHebrewName?: string
  husbandCellPhone?: string
  wifeCellPhone?: string
  email?: string
  phone?: string
  address?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  paymentPlanId?: string // MongoDB ObjectId reference to PaymentPlan (may be missing for old families)
  currentPlan?: number // Legacy field - will be auto-converted to paymentPlanId
  currentPayment: number
  openBalance: number
  memberCount?: number
}

interface PaymentPlan {
  _id: string
  name: string
  yearlyPrice: number
  planNumber?: number // Optional for backward compatibility
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFamily, setEditingFamily] = useState<Family | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; familyId: string | null; familyName: string }>({
    isOpen: false,
    familyId: null,
    familyName: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showBulkTagModal, setShowBulkTagModal] = useState(false)
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false)
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('table')
  const itemsPerPage = 10

  // Define filter fields for families
  const familyFilterFields = [
    { id: 'name', label: 'Family Name', type: 'text' as const },
    { id: 'hebrewName', label: 'Hebrew Name', type: 'text' as const },
    { id: 'email', label: 'Email', type: 'text' as const },
    { id: 'phone', label: 'Phone', type: 'text' as const },
    { id: 'city', label: 'City', type: 'text' as const },
    { id: 'state', label: 'State', type: 'text' as const },
    { id: 'zip', label: 'ZIP Code', type: 'text' as const },
    { id: 'weddingDate', label: 'Wedding Date', type: 'date' as const },
    { 
      id: 'paymentPlanId', 
      label: 'Payment Plan', 
      type: 'select' as const,
      options: paymentPlans.map(p => ({ value: p._id, label: p.name }))
    },
    { id: 'memberCount', label: 'Member Count', type: 'number' as const },
    { id: 'openBalance', label: 'Open Balance', type: 'number' as const },
    { id: 'currentPayment', label: 'Current Payment', type: 'number' as const },
  ]
  const [formData, setFormData] = useState({
    name: '',
    hebrewName: '',
    weddingDate: '',
    husbandFirstName: '',
    husbandHebrewName: '',
    husbandFatherHebrewName: '',
    wifeFirstName: '',
    wifeHebrewName: '',
    wifeFatherHebrewName: '',
    husbandCellPhone: '',
    wifeCellPhone: '',
    address: '',
    street: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    zip: '',
    paymentPlanId: '', // Store payment plan ID instead of plan number
    currentPayment: 0
  })

  useEffect(() => {
    fetchFamilies()
    fetchPaymentPlans()
  }, [])

  const fetchFamilies = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kasa/families')
      const data = await res.json()
      if (Array.isArray(data)) {
        setFamilies(data)
      } else {
        console.error('API error:', data)
        setFamilies([])
        showToast('Failed to load families', 'error')
      }
    } catch (error) {
      console.error('Error fetching families:', error)
      setFamilies([])
      showToast('Error loading families. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentPlans = async () => {
    try {
      const res = await fetch('/api/kasa/payment-plans')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPaymentPlans(data)
        // No default selection - user must explicitly choose
      }
    } catch (error) {
      console.error('Error fetching payment plans:', error)
    }
  }

  const getPlanNameById = (planId?: string, currentPlan?: number): string => {
    // Debug logging
    if (!planId && currentPlan) {
      console.log(`Looking up plan for currentPlan: ${currentPlan}, paymentPlans:`, paymentPlans)
    }
    
    if (planId) {
      const plan = paymentPlans.find(p => p._id === planId)
      if (plan) {
        console.log(`Found plan by ID: ${plan.name}`)
        return plan.name
      }
      console.log(`Plan ID ${planId} not found in paymentPlans`)
    }
    
    // Fallback: try to find by currentPlan number (for old families)
    if (currentPlan && paymentPlans.length > 0) {
      console.log(`Trying to find plan by planNumber: ${currentPlan}`)
      const plan = paymentPlans.find((p: any) => p.planNumber === currentPlan)
      if (plan) {
        console.log(`Found plan by planNumber: ${plan.name}`)
        return plan.name
      }
      console.log(`Plan with planNumber ${currentPlan} not found. Available plans:`, paymentPlans.map((p: any) => ({ name: p.name, planNumber: p.planNumber, _id: p._id })))
    }
    
    console.log(`Could not find plan. planId: ${planId}, currentPlan: ${currentPlan}, paymentPlans count: ${paymentPlans.length}`)
    return 'Unknown Plan'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Apply formatting before submission
    const formattedData = {
      ...formData,
      name: capitalizeName(formData.name),
      husbandFirstName: capitalizeName(formData.husbandFirstName),
      wifeFirstName: capitalizeName(formData.wifeFirstName),
      husbandCellPhone: formatPhone(formData.husbandCellPhone),
      wifeCellPhone: formatPhone(formData.wifeCellPhone),
      phone: formatPhone(formData.phone),
      email: formData.email || ''
    }
    
    // Validate email if provided
    if (formattedData.email && !validateEmail(formattedData.email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }
    
    try {
      const url = editingFamily 
        ? `/api/kasa/families/${editingFamily._id}`
        : '/api/kasa/families'
      
      const method = editingFamily ? 'PUT' : 'POST'
      
      // Log what we're sending (for debugging)
      console.log('Submitting family data:', {
        method,
        url,
        formData: {
          ...formattedData,
          // Show Hebrew names specifically
          hebrewName: formattedData.hebrewName,
          husbandHebrewName: formattedData.husbandHebrewName,
          husbandFatherHebrewName: formattedData.husbandFatherHebrewName,
          wifeHebrewName: formattedData.wifeHebrewName,
          wifeFatherHebrewName: formattedData.wifeFatherHebrewName
        }
      })
      
      // Explicitly log Hebrew names to verify they're being sent
      console.log('Hebrew names being sent:', {
        hebrewName: formattedData.hebrewName || '(empty)',
        husbandHebrewName: formattedData.husbandHebrewName || '(empty)',
        husbandFatherHebrewName: formattedData.husbandFatherHebrewName || '(empty)',
        wifeHebrewName: formattedData.wifeHebrewName || '(empty)',
        wifeFatherHebrewName: formattedData.wifeFatherHebrewName || '(empty)'
      })
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      })

      if (res.ok) {
        const result = await res.json()
        console.log('Family saved successfully:', result)
        setShowModal(false)
        setEditingFamily(null)
        resetForm()
        showToast(editingFamily ? 'Family updated successfully' : 'Family created successfully', 'success')
        fetchFamilies()
      } else {
        const error = await res.json()
        console.error('Error saving family:', error)
        showToast(`Error saving family: ${error.error || error.details || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving family:', error)
      showToast('Error saving family. Please try again.', 'error')
    }
  }

  const handleEdit = (family: Family) => {
    setEditingFamily(family)
    
    // Use paymentPlanId directly (ID-based system)
    if (!family.paymentPlanId) {
      console.error('Family does not have paymentPlanId set')
      showToast('Error: Family is missing payment plan. Please update the family.', 'warning')
      return
    }
    
    setFormData({
      name: family.name,
      hebrewName: family.hebrewName || '',
      weddingDate: new Date(family.weddingDate).toISOString().split('T')[0],
      husbandFirstName: family.husbandFirstName || '',
      husbandHebrewName: family.husbandHebrewName || '',
      husbandFatherHebrewName: family.husbandFatherHebrewName || '',
      wifeFirstName: family.wifeFirstName || '',
      wifeHebrewName: family.wifeHebrewName || '',
      wifeFatherHebrewName: family.wifeFatherHebrewName || '',
      husbandCellPhone: family.husbandCellPhone || '',
      wifeCellPhone: family.wifeCellPhone || '',
      address: family.address || '',
      street: family.street || '',
      phone: family.phone || '',
      email: family.email || '',
      city: family.city || '',
      state: family.state || '',
      zip: family.zip || '',
      paymentPlanId: family.paymentPlanId,
      currentPayment: family.currentPayment
    })
    setShowModal(true)
  }

  const handleDeleteClick = (family: Family) => {
    setDeleteConfirm({
      isOpen: true,
      familyId: family._id,
      familyName: family.name
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.familyId) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/kasa/families/${deleteConfirm.familyId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast(`Family "${deleteConfirm.familyName}" moved to recycle bin`, 'success')
        fetchFamilies()
      } else {
        const error = await res.json()
        showToast(`Error deleting family: ${error.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting family:', error)
      showToast('Error deleting family. Please try again.', 'error')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm({ isOpen: false, familyId: null, familyName: '' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, familyId: null, familyName: '' })
  }

  const resetForm = () => {
    // No default selection - user must explicitly choose
    setFormData({
      name: '',
      hebrewName: '',
      weddingDate: '',
      husbandFirstName: '',
      husbandHebrewName: '',
      husbandFatherHebrewName: '',
      wifeFirstName: '',
      wifeHebrewName: '',
      wifeFatherHebrewName: '',
      husbandCellPhone: '',
      wifeCellPhone: '',
      address: '',
      street: '',
      phone: '',
      email: '',
      city: '',
      state: '',
      zip: '',
      paymentPlanId: '', // Empty - requires user selection
      currentPayment: 0
    })
  }

  // Filter families based on search query - searches across all fields
  const searchFilteredFamilies = families.filter((family) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    
    // Search across all text fields
    const searchableFields = [
      family.name,
      family.hebrewName,
      family.husbandFirstName,
      family.husbandHebrewName,
      family.husbandFatherHebrewName,
      family.wifeFirstName,
      family.wifeHebrewName,
      family.wifeFatherHebrewName,
      family.email,
      family.phone,
      family.husbandCellPhone,
      family.wifeCellPhone,
      family.address,
      family.street,
      family.city,
      family.state,
      family.zip,
      getPlanNameById(family.paymentPlanId, family.currentPlan),
      family.memberCount?.toString(),
      family.openBalance?.toString(),
      family.weddingDate ? new Date(family.weddingDate).toLocaleDateString() : ''
    ].filter(Boolean) // Remove null/undefined values
    
    // Check if any field contains the search query
    return searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(query)
    )
  })

  // Apply advanced filters
  const filteredFamilies = applyFilters(searchFilteredFamilies, filterGroups)

  // Sort families based on selected column
  const sortedFamilies = [...filteredFamilies].sort((a, b) => {
    if (!sortColumn) return 0

    let aValue: any
    let bValue: any

    switch (sortColumn) {
      case 'name':
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
        break
      case 'weddingDate':
        aValue = a.weddingDate ? new Date(a.weddingDate).getTime() : 0
        bValue = b.weddingDate ? new Date(b.weddingDate).getTime() : 0
        break
      case 'members':
        aValue = a.memberCount || 0
        bValue = b.memberCount || 0
        break
      case 'plan':
        aValue = getPlanNameById(a.paymentPlanId, a.currentPlan).toLowerCase()
        bValue = getPlanNameById(b.paymentPlanId, b.currentPlan).toLowerCase()
        break
      case 'balance':
        aValue = a.openBalance || 0
        bValue = b.openBalance || 0
        break
      default:
        return 0
    }

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = ''
    if (bValue === null || bValue === undefined) bValue = ''

    // Compare values
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Bulk selection (after sortedFamilies is defined)
  const bulkSelection = useBulkSelection({
    items: sortedFamilies,
    getItemId: (item) => item._id,
  })

  // Bulk edit fields
  const bulkEditFields = [
    { 
      id: 'paymentPlanId', 
      label: 'Payment Plan', 
      type: 'select' as const,
      options: paymentPlans.map(p => ({ value: p._id, label: p.name }))
    },
    { id: 'city', label: 'City', type: 'text' as const },
    { id: 'state', label: 'State', type: 'text' as const },
    { id: 'zip', label: 'ZIP Code', type: 'text' as const },
    { id: 'currentPayment', label: 'Current Payment', type: 'number' as const },
    { id: 'receiveEmails', label: 'Receive Emails', type: 'boolean' as const },
    { id: 'receiveSMS', label: 'Receive SMS', type: 'boolean' as const },
  ]

  // Bulk operation handlers
  const handleBulkUpdate = async (updates: Record<string, any>) => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/bulk/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'update',
          familyIds: selectedIds,
          updates,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || 'Families updated successfully', 'success')
        bulkSelection.clearSelection()
        fetchFamilies()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update families', 'error')
      }
    } catch (error) {
      console.error('Error updating families:', error)
      showToast('Error updating families', 'error')
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/bulk/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'delete',
          familyIds: selectedIds,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || 'Families deleted successfully', 'success')
        bulkSelection.clearSelection()
        fetchFamilies()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete families', 'error')
      }
    } catch (error) {
      console.error('Error deleting families:', error)
      showToast('Error deleting families', 'error')
    }
  }

  const handleBulkExport = async () => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/bulk/families?ids=${selectedIds.join(',')}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        const data = await res.json()
        // Convert to CSV
        const headers = ['Name', 'Email', 'Phone', 'City', 'State', 'ZIP', 'Wedding Date', 'Members', 'Balance']
        const csv = [
          headers.join(','),
          ...data.map((f: any) => [
            f.name || '',
            f.email || '',
            f.phone || '',
            f.city || '',
            f.state || '',
            f.zip || '',
            f.weddingDate ? new Date(f.weddingDate).toLocaleDateString() : '',
            f.memberCount || 0,
            f.openBalance || 0,
          ].join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `families-export-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)

        showToast(`Exported ${data.length} families`, 'success')
      }
    } catch (error) {
      console.error('Error exporting families:', error)
      showToast('Error exporting families', 'error')
    }
  }

  const handleBulkTag = async (tags: string[], action: 'add' | 'remove') => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/bulk/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: action === 'add' ? 'tag' : 'untag',
          familyIds: selectedIds,
          updates: { tags },
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || `Tags ${action === 'add' ? 'added' : 'removed'} successfully`, 'success')
        bulkSelection.clearSelection()
        fetchFamilies()
      } else {
        const error = await res.json()
        showToast(error.error || `Failed to ${action} tags`, 'error')
      }
    } catch (error) {
      console.error(`Error ${action}ing tags:`, error)
      showToast(`Error ${action}ing tags`, 'error')
    }
  }

  const handleBulkEmail = async (subject: string, message: string) => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'email',
          familyIds: selectedIds,
          subject,
          message,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || 'Emails sent successfully', 'success')
        bulkSelection.clearSelection()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to send emails', 'error')
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      showToast('Error sending emails', 'error')
    }
  }

  const handleBulkSMS = async (subject: string, message: string) => {
    const selectedIds = bulkSelection.getSelectedIds()
    if (selectedIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'sms',
          familyIds: selectedIds,
          message, // SMS doesn't use subject
        }),
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || 'SMS messages sent successfully', 'success')
        bulkSelection.clearSelection()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to send SMS messages', 'error')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      showToast('Error sending SMS messages', 'error')
    }
  }

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Reset to page 1 when search query, filters, or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterGroups, sortColumn, sortDirection])

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <TableSkeleton rows={10} />
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
              Families
            </h1>
            <p className="text-gray-600">Manage family members and their information</p>
          </div>
          <div className="flex items-center gap-3">
            <TableImportExport
              data={families}
              filename="families"
              headers={[
                { key: 'name', label: 'Name' },
                { key: 'hebrewName', label: 'Hebrew Name' },
                { key: 'weddingDate', label: 'Wedding Date' },
                { key: 'husbandFirstName', label: 'Husband First Name' },
                { key: 'husbandHebrewName', label: 'Husband Hebrew Name' },
                { key: 'wifeFirstName', label: 'Wife First Name' },
                { key: 'wifeHebrewName', label: 'Wife Hebrew Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'address', label: 'Address' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'zip', label: 'ZIP' },
                { key: 'currentPayment', label: 'Current Payment' },
                { key: 'openBalance', label: 'Open Balance' }
              ]}
              onImport={async (importedData) => {
                // Import families from CSV
                let successCount = 0
                let errorCount = 0
                
                for (const familyData of importedData) {
                  try {
                    // Map CSV data to family format
                    const familyPayload = {
                      name: familyData.name || '',
                      hebrewName: familyData.hebrewName || '',
                      weddingDate: familyData.weddingDate || new Date().toISOString(),
                      husbandFirstName: familyData.husbandFirstName || '',
                      husbandHebrewName: familyData.husbandHebrewName || '',
                      wifeFirstName: familyData.wifeFirstName || '',
                      wifeHebrewName: familyData.wifeHebrewName || '',
                      email: familyData.email || '',
                      phone: familyData.phone || '',
                      address: familyData.address || '',
                      city: familyData.city || '',
                      state: familyData.state || '',
                      zip: familyData.zip || '',
                      paymentPlanId: '', // Will need to be set manually
                      currentPayment: Number(familyData.currentPayment) || 0
                    }
                    
                    const res = await fetch('/api/kasa/families', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(familyPayload)
                    })
                    
                    if (res.ok) {
                      successCount++
                    } else {
                      errorCount++
                    }
                  } catch (error) {
                    errorCount++
                  }
                }
                
                if (successCount > 0) {
                  showToast(`Imported ${successCount} families successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`, successCount === importedData.length ? 'success' : 'warning')
                  fetchFamilies()
                } else {
                  showToast('Failed to import families', 'error')
                }
              }}
            />
            <button
              onClick={() => {
                resetForm()
                setEditingFamily(null)
                setShowModal(true)
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              Add Family
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
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
                placeholder="Search families by name, email, phone, address, plan, or any field..."
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
              entityType="family"
              onApplyFilter={(filters) => {
                setFilterGroups(filters)
                setCurrentPage(1)
                showToast('Quick filter applied', 'success')
              }}
            />
            <FilterBuilder
              fields={familyFilterFields}
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
              entityType="family"
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
                Showing {sortedFamilies.length} of {families.length} {sortedFamilies.length === 1 ? 'family' : 'families'}
              </span>
            </div>
          )}
        </div>

        <div className="glass-strong rounded-2xl shadow-xl overflow-hidden border border-white/30">
          {viewType === 'table' && (
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-white/30 transition-colors select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    <span>Name</span>
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-white/30 transition-colors select-none"
                  onClick={() => handleSort('weddingDate')}
                >
                  <div className="flex items-center gap-2">
                    <span>Wedding Date</span>
                    {sortColumn === 'weddingDate' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-white/30 transition-colors select-none"
                  onClick={() => handleSort('members')}
                >
                  <div className="flex items-center gap-2">
                    <span>Members</span>
                    {sortColumn === 'members' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-white/30 transition-colors select-none"
                  onClick={() => handleSort('plan')}
                >
                  <div className="flex items-center gap-2">
                    <span>Plan</span>
                    {sortColumn === 'plan' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-white/30 transition-colors select-none"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center gap-2">
                    <span>Balance</span>
                    {sortColumn === 'balance' ? (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 opacity-50" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-white/20">
              {filteredFamilies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState
                      icon={searchQuery ? 'search' : 'inbox'}
                      title={searchQuery ? `No families found matching "${searchQuery}"` : 'No families found'}
                      description={searchQuery ? 'Try adjusting your search terms or clear the search to see all families.' : 'Get started by adding your first family to the system.'}
                      action={searchQuery ? undefined : {
                        label: 'Add Family',
                        onClick: () => {
                          resetForm()
                          setEditingFamily(null)
                          setShowModal(true)
                        }
                      }}
                    />
                    {searchQuery && (
                      <div className="text-center mt-4">
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedFamilies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((family) => (
                <tr key={family._id} className={`hover:bg-white/20 transition-colors ${bulkSelection.isSelected(family._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={bulkSelection.isSelected(family._id)}
                      onChange={() => bulkSelection.toggleSelection(family._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/families/${family._id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                    >
                      {family.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(family.weddingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    {family.memberCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getPlanNameById(family.paymentPlanId, family.currentPlan)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${family.openBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/families/${family._id}?tab=members&add=true`}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                        title="Add Child"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleEdit(family)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit Family"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(family)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Family"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
          {filteredFamilies.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredFamilies.length / itemsPerPage)}
              totalItems={filteredFamilies.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}

          {viewType === 'kanban' && (
            <div className="p-6">
              <KanbanBoard
                items={sortedFamilies}
                getItemId={(f) => f._id}
                getItemStatus={(f) => {
                  if (f.openBalance > 1000) return 'high-balance'
                  if (f.openBalance > 0) return 'has-balance'
                  return 'paid'
                }}
                columns={[
                  { id: 'paid', title: 'Paid Up', status: 'paid', color: 'green' },
                  { id: 'has-balance', title: 'Has Balance', status: 'has-balance', color: 'yellow' },
                  { id: 'high-balance', title: 'High Balance', status: 'high-balance', color: 'red' },
                ]}
                renderItem={(family) => (
                  <div>
                    <Link href={`/families/${family._id}`} className="font-semibold text-blue-600 hover:underline">
                      {family.name}
                    </Link>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4" />
                        {family.memberCount || 0} members
                      </div>
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        ${family.openBalance.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(family.weddingDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {viewType === 'card' && (
            <div className="p-6">
              <CardView
                items={sortedFamilies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                columns={3}
                renderCard={(family) => (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <Link href={`/families/${family._id}`} className="font-semibold text-lg text-blue-600 hover:underline">
                        {family.name}
                      </Link>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(family._id)}
                        onChange={() => bulkSelection.toggleSelection(family._id)}
                        className="rounded border-gray-300 text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(family.weddingDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4" />
                        {family.memberCount || 0} members
                      </div>
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        ${family.openBalance.toLocaleString()}
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        {getPlanNameById(family.paymentPlanId, family.currentPlan)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(family)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(family)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              />
              {filteredFamilies.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredFamilies.length / itemsPerPage)}
                  totalItems={filteredFamilies.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}

          {viewType === 'list' && (
            <div className="p-6">
              <ListView
                items={sortedFamilies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                renderItem={(family) => (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(family._id)}
                        onChange={() => bulkSelection.toggleSelection(family._id)}
                        className="rounded border-gray-300 text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Link href={`/families/${family._id}`} className="font-medium text-blue-600 hover:underline flex-1">
                        {family.name}
                      </Link>
                      <span className="text-sm text-gray-600 w-32">{new Date(family.weddingDate).toLocaleDateString()}</span>
                      <span className="text-sm text-gray-600 w-24 flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4" />
                        {family.memberCount || 0}
                      </span>
                      <span className="text-sm text-gray-600 w-32">{getPlanNameById(family.paymentPlanId, family.currentPlan)}</span>
                      <span className="text-sm font-medium w-24">${family.openBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(family)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(family)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              />
              {filteredFamilies.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredFamilies.length / itemsPerPage)}
                  totalItems={filteredFamilies.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={bulkSelection.selectedCount}
          totalCount={sortedFamilies.length}
          onSelectAll={bulkSelection.selectAll}
          onSelectNone={bulkSelection.selectNone}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onBulkDelete={handleBulkDelete}
          onBulkTag={() => setShowBulkTagModal(true)}
          onBulkEmail={() => setShowBulkEmailModal(true)}
          onBulkSMS={() => setShowBulkSMSModal(true)}
          onBulkExport={handleBulkExport}
          availableActions={{
            edit: true,
            delete: true,
            tag: true,
            email: true,
            sms: true,
            export: true,
          }}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          selectedCount={bulkSelection.selectedCount}
          entityType="family"
          fields={bulkEditFields}
          onSave={handleBulkUpdate}
        />

        {/* Bulk Tag Modal */}
        <BulkTagModal
          isOpen={showBulkTagModal}
          onClose={() => setShowBulkTagModal(false)}
          selectedCount={bulkSelection.selectedCount}
          entityType="family"
          onSave={handleBulkTag}
        />

        {/* Bulk Email Modal */}
        <BulkMessageModal
          isOpen={showBulkEmailModal}
          onClose={() => setShowBulkEmailModal(false)}
          selectedCount={bulkSelection.selectedCount}
          messageType="email"
          onSend={handleBulkEmail}
        />

        {/* Bulk SMS Modal */}
        <BulkMessageModal
          isOpen={showBulkSMSModal}
          onClose={() => setShowBulkSMSModal(false)}
          selectedCount={bulkSelection.selectedCount}
          messageType="sms"
          onSend={handleBulkSMS}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Family"
          message={`Are you sure you want to delete "${deleteConfirm.familyName}"? This will move the family to the recycle bin.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
          type="danger"
          isLoading={isDeleting}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <FamilyModal
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowModal(false)
              setEditingFamily(null)
              resetForm()
            }}
            editing={!!editingFamily}
            paymentPlans={paymentPlans}
          />
          </div>
        )}
      </div>
    </div>
  )
}

function FamilyModal({
  formData,
  setFormData,
  onSubmit,
  onClose,
  editing,
  paymentPlans
}: {
  formData: any
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  editing: boolean
  paymentPlans: PaymentPlan[]
}) {
  return (
    <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
        <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Family</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Family Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, name: capitalizeName(e.target.value) })
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Family Name (Hebrew) *</label>
              <input
                type="text"
                required
                dir="rtl"
                lang="he"
                inputMode="text"
                value={formData.hebrewName}
                onChange={(e) => setFormData({ ...formData, hebrewName: e.target.value })}
                onKeyDown={(e) => handleHebrewInput(e, formData.hebrewName, (value) => setFormData({ ...formData, hebrewName: value }))}
                className="w-full border rounded px-3 py-2 text-right font-hebrew"
                placeholder="שם משפחה בעברית"
                style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Husband First Name</label>
              <input
                type="text"
                value={formData.husbandFirstName}
                onChange={(e) => setFormData({ ...formData, husbandFirstName: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, husbandFirstName: capitalizeName(e.target.value) })
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Husband First Name (Hebrew) *</label>
              <input
                type="text"
                required
                dir="rtl"
                lang="he"
                inputMode="text"
                value={formData.husbandHebrewName}
                onChange={(e) => setFormData({ ...formData, husbandHebrewName: e.target.value })}
                onKeyDown={(e) => handleHebrewInput(e, formData.husbandHebrewName, (value) => setFormData({ ...formData, husbandHebrewName: value }))}
                className="w-full border rounded px-3 py-2 text-right font-hebrew"
                placeholder="שם פרטי בעברית"
                style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Husband's Father First Name (Hebrew)</label>
              <input
                type="text"
                dir="rtl"
                lang="he"
                inputMode="text"
                value={formData.husbandFatherHebrewName}
                onChange={(e) => setFormData({ ...formData, husbandFatherHebrewName: e.target.value })}
                onKeyDown={(e) => handleHebrewInput(e, formData.husbandFatherHebrewName, (value) => setFormData({ ...formData, husbandFatherHebrewName: value }))}
                className="w-full border rounded px-3 py-2 text-right font-hebrew"
                placeholder="שם פרטי של האב בעברית"
                style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wife First Name</label>
              <input
                type="text"
                value={formData.wifeFirstName}
                onChange={(e) => setFormData({ ...formData, wifeFirstName: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, wifeFirstName: capitalizeName(e.target.value) })
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wife First Name (Hebrew) *</label>
              <input
                type="text"
                required
                dir="rtl"
                lang="he"
                inputMode="text"
                value={formData.wifeHebrewName}
                onChange={(e) => setFormData({ ...formData, wifeHebrewName: e.target.value })}
                onKeyDown={(e) => handleHebrewInput(e, formData.wifeHebrewName, (value) => setFormData({ ...formData, wifeHebrewName: value }))}
                className="w-full border rounded px-3 py-2 text-right font-hebrew"
                placeholder="שם פרטי בעברית"
                style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wife's Father First Name (Hebrew)</label>
              <input
                type="text"
                dir="rtl"
                lang="he"
                inputMode="text"
                value={formData.wifeFatherHebrewName}
                onChange={(e) => setFormData({ ...formData, wifeFatherHebrewName: e.target.value })}
                onKeyDown={(e) => handleHebrewInput(e, formData.wifeFatherHebrewName, (value) => setFormData({ ...formData, wifeFatherHebrewName: value }))}
                className="w-full border rounded px-3 py-2 text-right font-hebrew"
                placeholder="שם פרטי של האב בעברית"
                style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Husband Cell Phone</label>
              <input
                type="tel"
                value={formData.husbandCellPhone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData({ ...formData, husbandCellPhone: formatted })
                }}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                  }
                }}
                className="w-full border rounded px-3 py-2"
                placeholder="1234567890"
                pattern="[0-9]*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wife Cell Phone</label>
              <input
                type="tel"
                value={formData.wifeCellPhone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData({ ...formData, wifeCellPhone: formatted })
                }}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                  }
                }}
                className="w-full border rounded px-3 py-2"
                placeholder="1234567890"
                pattern="[0-9]*"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value && !validateEmail(e.target.value)) {
                    alert('Please enter a valid email address')
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData({ ...formData, phone: formatted })
                }}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                  }
                }}
                className="w-full border rounded px-3 py-2"
                placeholder="1234567890"
                pattern="[0-9]*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wedding Date *</label>
              <input
                type="date"
                required
                value={formData.weddingDate}
                onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Plan *</label>
              <select
                required
                value={formData.paymentPlanId || ''}
                onChange={(e) => setFormData({ ...formData, paymentPlanId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a payment plan...</option>
                {paymentPlans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - ${plan.yearlyPrice.toLocaleString()}/year
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
    </div>
  )
}

