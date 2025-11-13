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
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Pagination from '@/app/components/Pagination'

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
  const itemsPerPage = 10
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
      const res = await fetch('/api/kasa/families')
      const data = await res.json()
      if (Array.isArray(data)) {
        setFamilies(data)
      } else {
        console.error('API error:', data)
        setFamilies([])
      }
    } catch (error) {
      console.error('Error fetching families:', error)
      setFamilies([])
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
      alert('Please enter a valid email address')
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
        fetchFamilies()
      } else {
        const error = await res.json()
        console.error('Error saving family:', error)
        alert(`Error saving family: ${error.error || error.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving family:', error)
      alert('Error saving family. Please check the console for details.')
    }
  }

  const handleEdit = (family: Family) => {
    setEditingFamily(family)
    
    // Use paymentPlanId directly (ID-based system)
    if (!family.paymentPlanId) {
      console.error('Family does not have paymentPlanId set')
      alert('Error: Family is missing payment plan. Please update the family.')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family?')) return
    
    try {
      const res = await fetch(`/api/kasa/families/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchFamilies()
      }
    } catch (error) {
      console.error('Error deleting family:', error)
    }
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
  const filteredFamilies = families.filter((family) => {
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

  // Reset to page 1 when search query or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortColumn, sortDirection])

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
              Families
            </h1>
            <p className="text-gray-600">Manage family members and their information</p>
          </div>
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search families by name, email, phone, address, plan, or any field..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="text-sm">Clear</span>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-500">
              Found {sortedFamilies.length} {sortedFamilies.length === 1 ? 'family' : 'families'} matching "{searchQuery}"
            </p>
          )}
        </div>

        <div className="glass-strong rounded-2xl shadow-xl overflow-hidden border border-white/30">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/20 backdrop-blur-sm">
              <tr>
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <MagnifyingGlassIcon className="mx-auto h-12 w-12" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {searchQuery ? `No families found matching "${searchQuery}"` : 'No families found'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedFamilies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((family) => (
                <tr key={family._id} className="hover:bg-white/20 transition-colors">
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
                        onClick={() => handleDelete(family._id)}
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
        </div>

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

