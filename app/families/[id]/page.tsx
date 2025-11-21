'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ArrowPathIcon as RefundIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { calculateHebrewAge, convertToHebrewDate } from '@/lib/hebrew-date'
import StripePaymentForm from '@/app/components/StripePaymentForm'
import Pagination from '@/app/components/Pagination'
import { getUser } from '@/lib/auth'

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

interface FamilyDetails {
  family: any
  members: any[]
  payments: any[]
  withdrawals: any[]
  lifecycleEvents: any[]
  balance: any
}

interface PaymentPlan {
  _id: string
  name: string
  yearlyPrice: number
  planNumber?: number
}

interface LifecycleEventType {
  _id: string
  type: string
  name: string
  amount: number
}

export default function FamilyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const user = getUser()
  const [data, setData] = useState<FamilyDetails | null>(null)
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [lifecycleEventTypes, setLifecycleEventTypes] = useState<LifecycleEventType[]>([])
  const [statements, setStatements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: '',
    fromName: 'Kasa Family Management'
  })
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'payments' | 'events' | 'statements' | 'sub-families' | 'notes' | 'relationships' | 'history'>('info')
  const [notes, setNotes] = useState<any[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [noteText, setNoteText] = useState('')
  const [relationships, setRelationships] = useState<any[]>([])
  const [loadingRelationships, setLoadingRelationships] = useState(false)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [relationshipForm, setRelationshipForm] = useState({
    relatedFamilyId: '',
    relationshipType: 'related' as 'related' | 'merged' | 'split' | 'parent_child' | 'sibling' | 'custom',
    customType: '',
    notes: ''
  })
  const [allFamilies, setAllFamilies] = useState<any[]>([])
  const [history, setHistory] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [subFamilies, setSubFamilies] = useState<any[]>([])
  const [loadingSubFamilies, setLoadingSubFamilies] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [infoForm, setInfoForm] = useState({
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
    paymentPlanId: '',
    receiveEmails: true,
    receiveSMS: true
  })
  
  // Check URL params for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'info' || tab === 'members' || tab === 'payments' || tab === 'events' || tab === 'statements' || tab === 'sub-families' || tab === 'notes' || tab === 'relationships' || tab === 'history') {
      setActiveTab(tab as any)
      // Auto-open modal if coming from quick add
      if (tab === 'members' && urlParams.get('add') === 'true') {
        // Will be handled after data loads
      }
    }
  }, [])
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)
  const [memberActiveTab, setMemberActiveTab] = useState<'info' | 'balance' | 'payments' | 'statements'>('info')
  const [memberBalance, setMemberBalance] = useState<any>(null)
  const [memberPayments, setMemberPayments] = useState<any[]>([])
  const [memberStatements, setMemberStatements] = useState<any[]>([])
  const [loadingMemberFinancials, setLoadingMemberFinancials] = useState(false)
  const [memberPaymentsPage, setMemberPaymentsPage] = useState(1)
  const [editingMemberField, setEditingMemberField] = useState<string | null>(null)
  const [editMemberValue, setEditMemberValue] = useState<string>('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [useStripe, setUseStripe] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [memberForm, setMemberForm] = useState({
    firstName: '',
    hebrewFirstName: '',
    lastName: '',
    hebrewLastName: '',
    birthDate: '',
    hebrewBirthDate: '',
    gender: '' as '' | 'male' | 'female',
    weddingDate: '',
    spouseName: '',
    spouseFirstName: '',
    spouseHebrewName: '',
    spouseFatherHebrewName: '',
    spouseCellPhone: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    type: 'membership' as 'membership' | 'donation' | 'other',
    paymentMethod: 'cash' as 'cash' | 'credit_card' | 'check' | 'quick_pay',
    paymentFrequency: 'one-time' as 'one-time' | 'monthly',
    paymentFor: 'family' as 'family' | 'member', // New field: payment for family or member
    memberId: '', // New field: selected member ID if paymentFor is 'member'
    saveCard: false,
    useSavedCard: false,
    selectedSavedCardId: '',
    // Credit Card Info
    ccLast4: '',
    ccCardType: '',
    ccExpiryMonth: '',
    ccExpiryYear: '',
    ccNameOnCard: '',
    // Check Info
    checkNumber: '',
    checkBankName: '',
    checkRoutingNumber: '',
    notes: ''
  })
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([])
  const [loadingSavedCards, setLoadingSavedCards] = useState(false)
  
  // Pagination state for each table
  const [membersPage, setMembersPage] = useState(1)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [eventsPage, setEventsPage] = useState(1)
  const itemsPerPage = 10

  // Disable Stripe if amount is 0 or less
  useEffect(() => {
    if (paymentForm.amount <= 0) {
      setUseStripe(false)
    }
  }, [paymentForm.amount])

  const [eventForm, setEventForm] = useState({
    eventType: 'chasena' as 'chasena' | 'bar_mitzvah' | 'birth_boy' | 'birth_girl',
    amount: 12180,
    eventDate: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    notes: ''
  })

  // Validate family ID
  const isValidFamilyId = (id: string | string[] | undefined): boolean => {
    if (!id || Array.isArray(id)) return false
    if (id === 'null' || id === 'undefined' || id.trim() === '') return false
    // Check if it looks like a valid MongoDB ObjectId (24 hex characters)
    return /^[0-9a-fA-F]{24}$/.test(id)
  }

  useEffect(() => {
    // Validate ID before making any API calls
    if (!isValidFamilyId(params.id)) {
      console.error('Invalid family ID:', params.id)
      setData(null)
      setLoading(false)
      router.push('/families')
      return
    }

    if (params.id) {
      fetchFamilyDetails()
      fetchStatements()
      fetchSubFamilies()
      fetchNotes()
    }
    fetchPaymentPlans()
    fetchLifecycleEventTypes()
    fetchEmailConfig()
  }, [params.id, router])

  useEffect(() => {
    if (activeTab === 'notes' && params.id) {
      fetchNotes()
    }
    if (activeTab === 'relationships' && params.id) {
      fetchRelationships()
      fetchAllFamilies()
    }
    if (activeTab === 'history' && params.id) {
      fetchHistory()
    }
  }, [activeTab, params.id])

  const fetchRelationships = async () => {
    if (!isValidFamilyId(params.id)) return
    setLoadingRelationships(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/families/${params.id}/relationships`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setRelationships(data || [])
      }
    } catch (error) {
      console.error('Error fetching relationships:', error)
    } finally {
      setLoadingRelationships(false)
    }
  }

  const fetchAllFamilies = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/families', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        // Filter out current family
        setAllFamilies(data.filter((f: any) => f._id !== params.id) || [])
      }
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const fetchHistory = async () => {
    if (!isValidFamilyId(params.id)) return
    setLoadingHistory(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/families/${params.id}/history`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSaveRelationship = async () => {
    if (!relationshipForm.relatedFamilyId || !relationshipForm.relationshipType) {
      alert('Please select a family and relationship type')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/families/${params.id}/relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(relationshipForm)
      })

      if (res.ok) {
        await fetchRelationships()
        setShowRelationshipModal(false)
        setRelationshipForm({
          relatedFamilyId: '',
          relationshipType: 'related',
          customType: '',
          notes: ''
        })
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create relationship')
      }
    } catch (error) {
      console.error('Error creating relationship:', error)
      alert('Failed to create relationship')
    }
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/families/${params.id}/relationships/${relationshipId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        await fetchRelationships()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete relationship')
      }
    } catch (error) {
      console.error('Error deleting relationship:', error)
      alert('Failed to delete relationship')
    }
  }

  const fetchSubFamilies = async () => {
    if (!isValidFamilyId(params.id)) return
    setLoadingSubFamilies(true)
    try {
      const res = await fetch(`/api/kasa/families/${params.id}/sub-families`)
      if (res.ok) {
        const data = await res.json()
        setSubFamilies(data || [])
      }
    } catch (error) {
      console.error('Error fetching sub-families:', error)
    } finally {
      setLoadingSubFamilies(false)
    }
  }

  const fetchNotes = async () => {
    if (!isValidFamilyId(params.id)) return
    setLoadingNotes(true)
    try {
      const res = await fetch(`/api/kasa/families/${params.id}/notes`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleAddNote = () => {
    setEditingNote(null)
    setNoteText('')
    setShowNoteModal(true)
  }

  const handleEditNote = (note: any) => {
    setEditingNote(note)
    setNoteText(note.note)
    setShowNoteModal(true)
  }

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      alert('Please enter a note')
      return
    }

    try {
      if (editingNote) {
        // Update existing note
        const res = await fetch(`/api/kasa/families/${params.id}/notes/${editingNote._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: noteText.trim() })
        })
        if (res.ok) {
          await fetchNotes()
          setShowNoteModal(false)
          setEditingNote(null)
          setNoteText('')
        } else {
          const errorData = await res.json()
          alert(`Error updating note: ${errorData.error || 'Unknown error'}`)
        }
      } else {
        // Create new note
        const res = await fetch(`/api/kasa/families/${params.id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: noteText.trim() })
        })
        if (res.ok) {
          await fetchNotes()
          setShowNoteModal(false)
          setNoteText('')
        } else {
          const errorData = await res.json()
          alert(`Error creating note: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Error saving note. Please try again.')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const res = await fetch(`/api/kasa/families/${params.id}/notes/${noteId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetchNotes()
      } else {
        const errorData = await res.json()
        alert(`Error deleting note: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error deleting note. Please try again.')
    }
  }

  const handleRefund = async (paymentId: string, amount: number) => {
    if (!confirm(`Are you sure you want to refund $${amount.toLocaleString()}?`)) return

    const reason = prompt('Refund reason:\n1. duplicate\n2. fraudulent\n3. requested_by_customer\n4. cancelled\n5. error\n6. other', 'requested_by_customer') || 'requested_by_customer'
    const notes = prompt('Additional notes (optional):') || undefined

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount, reason, notes })
      })

      if (res.ok) {
        const result = await res.json()
        alert(`Refund processed successfully! Refund ID: ${result.refund.stripeRefundId || 'N/A'}`)
        // Refresh family data to show updated refund status
        if (params.id) {
          fetchFamilyDetails()
        }
      } else {
        const errorData = await res.json()
        alert(`Error processing refund: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      alert('Error processing refund. Please try again.')
    }
  }

  const handleToggleChecked = async (note: any) => {
    try {
      const res = await fetch(`/api/kasa/families/${params.id}/notes/${note._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          checked: !note.checked,
          checkedBy: 'Current User' // You can get this from auth context
        })
      })
      if (res.ok) {
        await fetchNotes()
      } else {
        const errorData = await res.json()
        alert(`Error updating note: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error toggling note checked status:', error)
      alert('Error updating note. Please try again.')
    }
  }

  // Fetch saved payment methods when payment modal opens or credit card is selected
  useEffect(() => {
    if (showPaymentModal && paymentForm.paymentMethod === 'credit_card' && params.id) {
      fetchSavedPaymentMethods()
    }
  }, [showPaymentModal, paymentForm.paymentMethod, params.id])

  // Fetch member financial data when viewing a member
  useEffect(() => {
    if (viewingMemberId) {
      fetchMemberFinancials()
    } else {
      // Reset member financial data when not viewing a member
      setMemberBalance(null)
      setMemberPayments([])
      setMemberStatements([])
    }
  }, [viewingMemberId, memberActiveTab])

  const fetchMemberFinancials = async () => {
    if (!viewingMemberId) return
    
    setLoadingMemberFinancials(true)
    try {
      if (memberActiveTab === 'balance') {
        const res = await fetch(`/api/kasa/members/${viewingMemberId}/balance`)
        if (res.ok) {
          const balance = await res.json()
          setMemberBalance(balance)
        }
      } else if (memberActiveTab === 'payments') {
        const res = await fetch(`/api/kasa/members/${viewingMemberId}/payments`)
        if (res.ok) {
          const payments = await res.json()
          setMemberPayments(payments)
        }
      } else if (memberActiveTab === 'statements') {
        const res = await fetch(`/api/kasa/members/${viewingMemberId}/statements`)
        if (res.ok) {
          const statements = await res.json()
          setMemberStatements(statements)
        }
      }
    } catch (error) {
      console.error('Error fetching member financials:', error)
    } finally {
      setLoadingMemberFinancials(false)
    }
  }

  const fetchSavedPaymentMethods = async () => {
    try {
      setLoadingSavedCards(true)
      const res = await fetch(`/api/kasa/families/${params.id}/saved-payment-methods`)
      if (res.ok) {
        const data = await res.json()
        setSavedPaymentMethods(data || [])
      }
    } catch (error) {
      console.error('Error fetching saved payment methods:', error)
      setSavedPaymentMethods([])
    } finally {
      setLoadingSavedCards(false)
    }
  }

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch('/api/kasa/email-config')
      if (res.ok) {
        const config = await res.json()
        setEmailConfig(config)
        if (config.email) {
          setEmailFormData(prev => ({
            ...prev,
            email: config.email,
            fromName: config.fromName || 'Kasa Family Management'
            // Note: Password is not returned for security reasons
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching email config:', error)
    }
  }

  const fetchPaymentPlans = async () => {
    try {
      const res = await fetch('/api/kasa/payment-plans')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPaymentPlans(data)
      }
    } catch (error) {
      console.error('Error fetching payment plans:', error)
    }
  }

  const fetchLifecycleEventTypes = async () => {
    try {
      const res = await fetch('/api/kasa/lifecycle-event-types')
      const data = await res.json()
      if (Array.isArray(data)) {
        setLifecycleEventTypes(data)
        // Set default event form to first event type if available
        if (data.length > 0) {
          setEventForm({
            eventType: data[0].type as any,
            amount: data[0].amount,
            eventDate: new Date().toISOString().split('T')[0],
            year: new Date().getFullYear(),
            notes: ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching lifecycle event types:', error)
    }
  }

  const fetchStatements = async () => {
    if (!isValidFamilyId(params.id)) return
    try {
      const res = await fetch(`/api/kasa/statements?familyId=${params.id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        // Sort by date (newest first)
        const sorted = data.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setStatements(sorted)
      }
    } catch (error) {
      console.error('Error fetching statements:', error)
    }
  }

  const getPlanNameById = (planId: string): string => {
    if (!planId) return 'No Plan'
    const plan = paymentPlans.find(p => p._id === planId)
    return plan ? plan.name : 'Unknown Plan'
  }

  const handlePrintStatement = async (statement: any) => {
    try {
      // Fetch transaction details
      const res = await fetch(`/api/kasa/statements/${statement._id}`)
      const data = await res.json()
      const transactions = data.transactions || []

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const transactionsHTML = transactions.length > 0 ? `
          <h2 style="margin-top: 30px; margin-bottom: 15px;">Transaction Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Type</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Description</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((t: any) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(t.date).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${t.type === 'payment' ? 'Payment' : t.type === 'withdrawal' ? 'Withdrawal' : 'Event'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${t.description}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; ${t.amount >= 0 ? 'color: green;' : 'color: red;'}">${t.amount >= 0 ? '+' : ''}$${t.amount.toLocaleString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${t.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''

        printWindow.document.write(`
          <html>
            <head>
              <title>Statement ${statement.statementNumber}</title>
              <style>
                @media print {
                  @page { margin: 1cm; }
                  body { margin: 0; }
                }
              </style>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
              <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="margin: 0; color: #333;">Kasa Family Management</h1>
                <h2 style="margin: 10px 0 0 0; color: #666; font-weight: normal;">Statement</h2>
              </div>
              
              <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Statement Number:</strong> ${statement.statementNumber}</td>
                    <td style="padding: 5px 0; text-align: right;"><strong>Date:</strong> ${new Date(statement.date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Family:</strong> ${data?.family?.name || 'N/A'}</td>
                    <td style="padding: 5px 0; text-align: right;"><strong>Period:</strong> ${new Date(statement.fromDate).toLocaleDateString()} - ${new Date(statement.toDate).toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Opening Balance:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.openingBalance.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Income:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: green;">$${statement.income.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Withdrawals:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: orange;">$${statement.withdrawals.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Expenses:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: red;">$${statement.expenses.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #f0f0f0;">
                  <td style="padding: 10px; font-weight: bold; font-size: 1.1em;">Closing Balance:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 1.1em;">$${statement.closingBalance.toLocaleString()}</td>
                </tr>
              </table>
              
              ${transactionsHTML}
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <p>Kasa Family Management System</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Error printing statement:', error)
      alert('Error printing statement')
    }
  }

  const handleSavePDFStatement = async (statement: any) => {
    try {
      // Fetch statement details with transactions
      const res = await fetch(`/api/kasa/statements/${statement._id}`)
      const statementData = await res.json()
      
      if (!res.ok) {
        throw new Error(statementData.error || 'Failed to fetch statement details')
      }

      // Generate PDF
      const pdfRes = await fetch('/api/kasa/statements/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: statementData.statement,
          familyName: data?.family?.name || 'Family',
          transactions: statementData.transactions || []
        })
      })

      if (!pdfRes.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Download PDF
      const pdfBlob = await pdfRes.blob()
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Statement_${statement.statementNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error saving PDF:', error)
      alert('Error saving PDF. Please try again.')
    }
  }

  const handleSendStatementEmail = async (statement: any) => {
    if (!data?.family?.email) {
      alert('This family does not have an email address. Please add an email address in the Contacts tab.')
      return
    }

    // Check if email config exists in database
    if (!emailConfig?.email) {
      // Show modal to configure email
      setShowEmailModal(true)
      return
    }

    setSendingEmail(statement._id)
    
    try {
      // Fetch statement details with transactions
      const res = await fetch(`/api/kasa/statements/${statement._id}`)
      const statementData = await res.json()
      
      if (!res.ok) {
        throw new Error(statementData.error || 'Failed to fetch statement details')
      }

      // Generate PDF
      const pdfRes = await fetch('/api/kasa/statements/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: statementData.statement,
          familyName: data.family.name,
          transactions: statementData.transactions || []
        })
      })

      if (!pdfRes.ok) {
        throw new Error('Failed to generate PDF')
      }

      const pdfBlob = await pdfRes.blob()
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const pdfBuffer = Array.from(new Uint8Array(arrayBuffer))

      // Send email (email config is automatically retrieved from database)
      const emailRes = await fetch('/api/kasa/statements/send-single-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: statementData.statement,
          familyName: data.family.name,
          familyEmail: data.family.email,
          transactions: statementData.transactions || [],
          pdfBuffer: btoa(String.fromCharCode(...pdfBuffer))
        })
      })

      const emailResult = await emailRes.json()
      
      if (emailRes.ok) {
        alert(`Statement sent successfully to ${data.family.email}`)
      } else {
        throw new Error(emailResult.error || 'Failed to send email')
      }
    } catch (error: any) {
      console.error('Error sending statement email:', error)
      alert(`Error sending email: ${error.message}`)
    } finally {
      setSendingEmail(null)
    }
  }

  const handleSaveEmailConfig = async () => {
    if (!emailFormData.email || !emailFormData.password) {
      alert('Please enter both email address and password')
      return
    }

    try {
      const res = await fetch('/api/kasa/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailFormData)
      })
      
      if (res.ok) {
        const config = await res.json()
        setEmailConfig(config)
        setShowEmailModal(false)
        alert('Email configuration saved successfully. You can now send statements.')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to save email configuration'}`)
      }
    } catch (error) {
      console.error('Error saving email config:', error)
      alert('Error saving email configuration')
    }
  }

  const handlePrintAllStatements = async () => {
    if (!data?.family) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      let allStatementsHTML = ''
      
      for (const statement of statements) {
        try {
          const res = await fetch(`/api/kasa/statements/${statement._id}`)
          const statementData = await res.json()
          const transactions = statementData.transactions || []

          const transactionsHTML = transactions.length > 0 ? `
            <h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 1em;">Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Date</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Type</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Description</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map((t: any) => `
                  <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">${new Date(t.date).toLocaleDateString()}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${t.type === 'payment' ? 'Payment' : t.type === 'withdrawal' ? 'Withdrawal' : 'Event'}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${t.description}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right; ${t.amount >= 0 ? 'color: green;' : 'color: red;'}">${t.amount >= 0 ? '+' : ''}$${t.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''

          allStatementsHTML += `
            <div style="page-break-after: always; margin-bottom: 40px;">
              <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="margin: 0; color: #333; font-size: 1.5em;">Kasa Family Management</h1>
                <h2 style="margin: 5px 0 0 0; color: #666; font-weight: normal; font-size: 1.2em;">Statement</h2>
              </div>
              
              <div style="margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Statement Number:</strong> ${statement.statementNumber}</td>
                    <td style="padding: 5px 0; text-align: right;"><strong>Date:</strong> ${new Date(statement.date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Family:</strong> ${data.family.name}</td>
                    <td style="padding: 5px 0; text-align: right;"><strong>Period:</strong> ${new Date(statement.fromDate).toLocaleDateString()} - ${new Date(statement.toDate).toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Opening Balance:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.openingBalance.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Income:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: green;">$${statement.income.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Withdrawals:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: orange;">$${statement.withdrawals.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Expenses:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: red;">$${statement.expenses.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #f0f0f0;">
                  <td style="padding: 8px; font-weight: bold;">Closing Balance:</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold;">$${statement.closingBalance.toLocaleString()}</td>
                </tr>
              </table>
              
              ${transactionsHTML}
            </div>
          `
        } catch (error) {
          console.error(`Error fetching statement ${statement._id}:`, error)
        }
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>All Statements - ${data.family.name}</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            ${allStatementsHTML}
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>Kasa Family Management System</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getPlanName = (planNumber: number): string => {
    if (!planNumber) return 'No Plan'
    const plan = paymentPlans.find(p => p.planNumber === planNumber)
    return plan ? plan.name : `Plan ${planNumber}`
  }

  // Extract last name from family name or existing members
  const getFamilyLastName = (): string => {
    if (!data?.family) return ''
    
    // First, try to get from existing members
    if (data.members && data.members.length > 0) {
      const lastName = data.members[0].lastName
      if (lastName) return lastName
    }
    
    // Otherwise, extract from family name
    const familyName = data.family.name || ''
    
    // Handle formats like "Smith Family", "John & Jane Smith", "Smith", etc.
    let lastName = ''
    
    // Remove "Family" suffix if present
    let nameWithoutSuffix = familyName.replace(/\s+Family$/i, '').trim()
    
    // If contains "&", take the last word after the &
    if (nameWithoutSuffix.includes('&')) {
      const parts = nameWithoutSuffix.split('&')
      if (parts.length > 1) {
        const afterAmpersand = parts[parts.length - 1].trim()
        const words = afterAmpersand.split(/\s+/)
        lastName = words[words.length - 1]
      }
    } else {
      // Otherwise, take the last word
      const words = nameWithoutSuffix.split(/\s+/)
      lastName = words[words.length - 1]
    }
    
    return lastName || ''
  }

  useEffect(() => {
    if (data?.family) {
      // Info form is set when Edit button is clicked
      
      // Auto-open modal if coming from quick add
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('add') === 'true') {
        const familyLastName = getFamilyLastName()
        setMemberForm({ 
          firstName: '', 
          hebrewFirstName: '',
          lastName: familyLastName, 
          hebrewLastName: '',
          birthDate: '', 
          hebrewBirthDate: '', 
          gender: '',
          weddingDate: '',
          spouseName: '',
          spouseFirstName: '',
          spouseHebrewName: '',
          spouseFatherHebrewName: '',
          spouseCellPhone: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: ''
        })
        setEditingMember(null)
        setShowMemberModal(true)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname + '?tab=members')
      }
    }
  }, [data])

  const handleFieldEdit = (fieldName: string, currentValue: any) => {
    // Convert date to string format if it's a date field
    if (fieldName === 'weddingDate' && currentValue) {
      const date = new Date(currentValue)
      setEditValue(date.toISOString().split('T')[0])
    } else {
      setEditValue(currentValue || '')
    }
    setEditingField(fieldName)
  }

  const handleFieldSave = async (fieldName: string) => {
    try {
      const updateData: any = {}
      let finalValue = editValue || ''
      
      // Apply formatting based on field type
      const phoneFields = ['phone', 'husbandCellPhone', 'wifeCellPhone']
      const emailFields = ['email']
      const nameFields = ['name', 'firstName', 'lastName', 'husbandFirstName', 'wifeFirstName']
      
      if (phoneFields.includes(fieldName)) {
        finalValue = formatPhone(finalValue)
      } else if (emailFields.includes(fieldName)) {
        if (finalValue && !validateEmail(finalValue)) {
          alert('Please enter a valid email address')
          return
        }
      } else if (nameFields.includes(fieldName)) {
        finalValue = capitalizeName(finalValue)
      }
      
      // Convert date string to Date object if it's a date field
      if (fieldName === 'weddingDate' && finalValue) {
        updateData[fieldName] = new Date(finalValue)
      } else if (fieldName === 'paymentPlanId') {
        // Handle payment plan ID
        updateData[fieldName] = finalValue || null
      } else if (fieldName === 'street') {
        // Update both street and address fields
        updateData.street = finalValue || ''
        updateData.address = finalValue || ''
      } else {
        updateData[fieldName] = finalValue || ''
      }

      const res = await fetch(`/api/kasa/families/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        setEditingField(null)
        setEditValue('')
        fetchFamilyDetails()
      } else {
        const errorData = await res.json()
        alert(`Error updating field: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating field:', error)
      alert('Error updating field. Please try again.')
    }
  }

  const handleFieldCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  // Helper function to render editable field
  const renderEditableField = (
    fieldName: string,
    displayValue: string | React.ReactNode,
    fieldType: 'text' | 'date' | 'select' | 'hebrew' | 'phone' | 'email' | 'name' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editingField === fieldName
    const currentValue = data?.family?.[fieldName] || ''

    // Determine input type and handlers based on field type
    const getInputProps = () => {
      if (fieldType === 'phone') {
        return {
          type: 'tel' as const,
          value: editValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhone(e.target.value)
            setEditValue(formatted)
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleFieldSave(fieldName)
            if (e.key === 'Escape') handleFieldCancel()
            // Allow numbers, backspace, delete, arrow keys, tab
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
              e.preventDefault()
            }
          },
          placeholder: '1234567890',
          pattern: '[0-9]*'
        }
      } else if (fieldType === 'email') {
        return {
          type: 'email' as const,
          value: editValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditValue(e.target.value)
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              if (validateEmail(editValue)) {
                handleFieldSave(fieldName)
              } else {
                alert('Please enter a valid email address')
              }
            }
            if (e.key === 'Escape') handleFieldCancel()
          },
          onBlur: () => {
            if (editValue && !validateEmail(editValue)) {
              alert('Please enter a valid email address')
            }
          }
        }
      } else if (fieldType === 'name') {
        return {
          type: 'text' as const,
          value: editValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditValue(e.target.value)
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleFieldSave(fieldName)
            if (e.key === 'Escape') handleFieldCancel()
          },
          onBlur: () => {
            if (editValue) {
              const capitalized = capitalizeName(editValue)
              setEditValue(capitalized)
            }
          }
        }
      } else if (fieldType === 'date') {
        return {
          type: 'date' as const,
          value: editValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value),
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleFieldSave(fieldName)
            if (e.key === 'Escape') handleFieldCancel()
          }
        }
      } else if (fieldType === 'hebrew') {
        return {
          type: 'text' as const,
          dir: 'rtl' as const,
          lang: 'he' as const,
          value: editValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value),
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleFieldSave(fieldName)
            if (e.key === 'Escape') handleFieldCancel()
            handleHebrewInput(e, editValue, setEditValue)
          },
          style: { fontFamily: 'Arial Hebrew, David, sans-serif' }
        }
      } else {
        return {
          type: 'text' as const,
          value: editValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value),
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleFieldSave(fieldName)
            if (e.key === 'Escape') handleFieldCancel()
          }
        }
      }
    }

    return (
      <div className="border border-gray-200 rounded px-3 py-2 relative group">
        {isEditing ? (
          <div className="flex items-center gap-2">
            {fieldType === 'select' && options ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleFieldCancel()
                }}
                className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                {...getInputProps()}
                className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            )}
            <button
              onClick={() => handleFieldSave(fieldName)}
              className="text-green-600 hover:text-green-800 font-bold"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={handleFieldCancel}
              className="text-red-600 hover:text-red-800 font-bold"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1">{displayValue}</div>
            <button
              onClick={() => handleFieldEdit(fieldName, currentValue)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 ml-2"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Helper function to render editable member field
  const renderEditableMemberField = (
    fieldName: string,
    displayValue: string | React.ReactNode,
    fieldType: 'text' | 'date' | 'select' | 'hebrew' | 'phone' | 'email' | 'name' = 'text',
    memberId: string,
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editingMemberField === `${memberId}-${fieldName}`
    const member = data?.members?.find((m: any) => m._id === memberId)
    const currentValue = member?.[fieldName] || ''

    // Determine input type and handlers based on field type
    const getInputProps = () => {
      if (fieldType === 'phone') {
        return {
          type: 'tel' as const,
          value: editMemberValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhone(e.target.value)
            setEditMemberValue(formatted)
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleMemberFieldSave(fieldName, memberId)
            if (e.key === 'Escape') handleMemberFieldCancel()
            // Allow numbers, backspace, delete, arrow keys, tab
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
              e.preventDefault()
            }
          },
          placeholder: '1234567890',
          pattern: '[0-9]*'
        }
      } else if (fieldType === 'email') {
        return {
          type: 'email' as const,
          value: editMemberValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditMemberValue(e.target.value)
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              if (validateEmail(editMemberValue)) {
                handleMemberFieldSave(fieldName, memberId)
              } else {
                alert('Please enter a valid email address')
              }
            }
            if (e.key === 'Escape') handleMemberFieldCancel()
          },
          onBlur: () => {
            if (editMemberValue && !validateEmail(editMemberValue)) {
              alert('Please enter a valid email address')
            }
          }
        }
      } else if (fieldType === 'name') {
        return {
          type: 'text' as const,
          value: editMemberValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditMemberValue(e.target.value)
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleMemberFieldSave(fieldName, memberId)
            if (e.key === 'Escape') handleMemberFieldCancel()
          },
          onBlur: () => {
            if (editMemberValue) {
              const capitalized = capitalizeName(editMemberValue)
              setEditMemberValue(capitalized)
            }
          }
        }
      } else if (fieldType === 'date') {
        return {
          type: 'date' as const,
          value: editMemberValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditMemberValue(e.target.value),
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleMemberFieldSave(fieldName, memberId)
            if (e.key === 'Escape') handleMemberFieldCancel()
          }
        }
      } else if (fieldType === 'hebrew') {
        return {
          type: 'text' as const,
          dir: 'rtl' as const,
          lang: 'he' as const,
          value: editMemberValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditMemberValue(e.target.value),
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleMemberFieldSave(fieldName, memberId)
            if (e.key === 'Escape') handleMemberFieldCancel()
            handleHebrewInput(e, editMemberValue, setEditMemberValue)
          },
          style: { fontFamily: 'Arial Hebrew, David, sans-serif' }
        }
      } else {
        return {
          type: 'text' as const,
          value: editMemberValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditMemberValue(e.target.value),
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleMemberFieldSave(fieldName, memberId)
            if (e.key === 'Escape') handleMemberFieldCancel()
          }
        }
      }
    }

    return (
      <div className="border border-gray-200 rounded px-3 py-2 relative group">
        {isEditing ? (
          <div className="flex items-center gap-2">
            {fieldType === 'select' && options ? (
              <select
                value={editMemberValue}
                onChange={(e) => setEditMemberValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleMemberFieldCancel()
                }}
                className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                {...getInputProps()}
                className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            )}
            <button
              onClick={() => handleMemberFieldSave(fieldName, memberId)}
              className="text-green-600 hover:text-green-800 font-bold"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={handleMemberFieldCancel}
              className="text-red-600 hover:text-red-800 font-bold"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1">{displayValue}</div>
            <button
              onClick={() => handleMemberFieldEdit(fieldName, currentValue, memberId)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 ml-2"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  const handleMemberFieldEdit = (fieldName: string, currentValue: any, memberId: string) => {
    // Convert date to string format if it's a date field
    if ((fieldName === 'birthDate' || fieldName === 'weddingDate') && currentValue) {
      const date = new Date(currentValue)
      setEditMemberValue(date.toISOString().split('T')[0])
    } else {
      setEditMemberValue(currentValue || '')
    }
    setEditingMemberField(`${memberId}-${fieldName}`)
  }

  const handleMemberFieldSave = async (fieldName: string, memberId: string) => {
    try {
      const member = data?.members?.find((m: any) => m._id === memberId)
      if (!member) {
        alert('Member not found')
        return
      }

      let finalValue = editMemberValue || ''
      
      // Apply formatting based on field type
      const phoneFields = ['phone', 'spouseCellPhone']
      const emailFields = ['email']
      const nameFields = ['firstName', 'lastName', 'spouseFirstName', 'spouseName']
      const addressFields = ['city', 'state', 'address'] // Fields that should be capitalized
      
      if (phoneFields.includes(fieldName)) {
        finalValue = formatPhone(finalValue)
      } else if (emailFields.includes(fieldName)) {
        if (finalValue && !validateEmail(finalValue)) {
          alert('Please enter a valid email address')
          return
        }
      } else if (nameFields.includes(fieldName) || addressFields.includes(fieldName)) {
        finalValue = capitalizeName(finalValue.trim())
      } else {
        // For other text fields, trim whitespace
        finalValue = finalValue.trim()
      }

      const updateData: any = {
        // Always include required fields from current member data
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        birthDate: member.birthDate ? new Date(member.birthDate) : new Date(),
        // Include optional fields that might exist
        hebrewFirstName: member.hebrewFirstName || '',
        hebrewLastName: member.hebrewLastName || '',
        gender: member.gender || '',
        weddingDate: member.weddingDate ? new Date(member.weddingDate) : undefined,
        spouseName: member.spouseName || '',
        spouseFirstName: member.spouseFirstName || '',
        spouseHebrewName: member.spouseHebrewName || '',
        spouseFatherHebrewName: member.spouseFatherHebrewName || '',
        spouseCellPhone: member.spouseCellPhone || '',
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        city: member.city || '',
        state: member.state || '',
        zip: member.zip || ''
      }
      
      // Update the specific field being edited
      if (fieldName === 'birthDate' || fieldName === 'weddingDate') {
        if (finalValue) {
          updateData[fieldName] = new Date(finalValue)
          // Auto-calculate Hebrew date for birthDate
          if (fieldName === 'birthDate') {
            const hebrewDate = convertToHebrewDate(new Date(finalValue))
            updateData.hebrewBirthDate = hebrewDate
          }
        } else {
          updateData[fieldName] = null
        }
      } else {
        // For text fields, explicitly set the value
        // Use the trimmed finalValue, or empty string if it's empty
        updateData[fieldName] = finalValue
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      // Ensure the field is explicitly set in updateData (important for fields that might be null/undefined)
      updateData[fieldName] = finalValue
      
      console.log('Saving member field:', { fieldName, finalValue, updateData, 'fieldInUpdateData': fieldName in updateData })

      const res = await fetch(`/api/kasa/families/${params.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        const updatedMember = await res.json()
        console.log('Member updated successfully:', updatedMember)
        console.log('Updated field value:', updatedMember[fieldName])
        setEditingMemberField(null)
        setEditMemberValue('')
        // Refresh the data to show the updated value
        await fetchFamilyDetails()
      } else {
        const errorData = await res.json()
        console.error('Error updating field:', errorData)
        alert(`Error updating field: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating member field:', error)
      alert('Error updating field. Please try again.')
    }
  }

  const handleMemberFieldCancel = () => {
    setEditingMemberField(null)
    setEditMemberValue('')
  }

  const fetchFamilyDetails = async () => {
    try {
      const res = await fetch(`/api/kasa/families/${params.id}`)
      const data = await res.json()
      
      // Check if API returned an error
      if (!res.ok || data.error || !data.family) {
        console.error('Error fetching family:', data.error || 'Family not found')
        setData(null)
        setLoading(false)
        return
      }
      
      // Backfill Hebrew dates for members that don't have them (calculate and update in DB)
      if (data.members) {
        const updatedMembers = await Promise.all(
          data.members.map(async (member: any) => {
            if (!member.hebrewBirthDate && member.birthDate) {
              try {
                const hebrewDate = convertToHebrewDate(new Date(member.birthDate))
                if (hebrewDate) {
                  // Update member in database with all required fields
                  try {
                    const updateRes = await fetch(`/api/kasa/families/${params.id}/members/${member._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        firstName: member.firstName,
                        lastName: member.lastName,
                        birthDate: new Date(member.birthDate).toISOString().split('T')[0],
                        hebrewBirthDate: hebrewDate,
                        gender: member.gender || ''
                      })
                    })
                    if (updateRes.ok) {
                      return { ...member, hebrewBirthDate: hebrewDate }
                    } else {
                      console.error('Failed to update member Hebrew date:', await updateRes.text())
                    }
                  } catch (updateError) {
                    console.error('Error updating member Hebrew date:', updateError)
                  }
                  // Return member with calculated Hebrew date for display even if update failed
                  return { ...member, hebrewBirthDate: hebrewDate }
                }
              } catch (e) {
                console.error('Error calculating Hebrew date:', e)
              }
            }
            return member
          })
        )
        data.members = updatedMembers
      }
      
      setData(data)
    } catch (error) {
      console.error('Error fetching family details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Apply formatting before submission
    const formattedForm = {
      ...memberForm,
      firstName: capitalizeName(memberForm.firstName),
      lastName: capitalizeName(memberForm.lastName),
      spouseFirstName: memberForm.spouseFirstName ? capitalizeName(memberForm.spouseFirstName) : '',
      spouseName: memberForm.spouseName ? capitalizeName(memberForm.spouseName) : '',
      phone: memberForm.phone ? formatPhone(memberForm.phone) : '',
      spouseCellPhone: memberForm.spouseCellPhone ? formatPhone(memberForm.spouseCellPhone) : '',
      email: memberForm.email || '',
      weddingDate: memberForm.weddingDate || undefined,
      address: memberForm.address || undefined,
      city: memberForm.city || undefined,
      state: memberForm.state || undefined,
      zip: memberForm.zip || undefined
    }
    
    // Validate email if provided
    if (formattedForm.email && !validateEmail(formattedForm.email)) {
      alert('Please enter a valid email address')
      return
    }
    
    try {
      const res = await fetch('/api/kasa/families/' + params.id + '/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formattedForm, familyId: params.id })
      })
      if (res.ok) {
        setShowMemberModal(false)
        setEditingMember(null)
        setMemberForm({ 
          firstName: '', hebrewFirstName: '', lastName: '', hebrewLastName: '', 
          birthDate: '', hebrewBirthDate: '', gender: '', weddingDate: '', 
          spouseName: '', spouseFirstName: '', spouseHebrewName: '', 
          spouseFatherHebrewName: '', spouseCellPhone: '', phone: '', 
          email: '', address: '', city: '', state: '', zip: '' 
        })
        fetchFamilyDetails()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Error adding member')
    }
  }

  const handleEditMember = (member: any) => {
    setEditingMember(member)
    setMemberForm({
      firstName: member.firstName,
      hebrewFirstName: member.hebrewFirstName || '',
      lastName: member.lastName,
      hebrewLastName: member.hebrewLastName || '',
      birthDate: new Date(member.birthDate).toISOString().split('T')[0],
      hebrewBirthDate: member.hebrewBirthDate || convertToHebrewDate(new Date(member.birthDate)),
      gender: member.gender || '',
      weddingDate: member.weddingDate ? new Date(member.weddingDate).toISOString().split('T')[0] : '',
      spouseName: member.spouseName || '',
      spouseFirstName: member.spouseFirstName || '',
      spouseHebrewName: member.spouseHebrewName || '',
      spouseFatherHebrewName: member.spouseFatherHebrewName || '',
      spouseCellPhone: member.spouseCellPhone || '',
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
      city: member.city || '',
      state: member.state || '',
      zip: member.zip || ''
    })
    setShowMemberModal(true)
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    
    // Apply formatting before submission
    const formattedData = {
      firstName: capitalizeName(memberForm.firstName),
      hebrewFirstName: memberForm.hebrewFirstName,
      lastName: capitalizeName(memberForm.lastName),
      hebrewLastName: memberForm.hebrewLastName,
      birthDate: memberForm.birthDate,
      hebrewBirthDate: memberForm.hebrewBirthDate,
      gender: memberForm.gender,
      weddingDate: memberForm.weddingDate || undefined,
      spouseName: memberForm.spouseName ? capitalizeName(memberForm.spouseName) : undefined,
      spouseFirstName: memberForm.spouseFirstName ? capitalizeName(memberForm.spouseFirstName) : undefined,
      spouseHebrewName: memberForm.spouseHebrewName || undefined,
      spouseFatherHebrewName: memberForm.spouseFatherHebrewName || undefined,
      spouseCellPhone: memberForm.spouseCellPhone ? formatPhone(memberForm.spouseCellPhone) : undefined,
      phone: memberForm.phone ? formatPhone(memberForm.phone) : undefined,
      email: memberForm.email || undefined,
      address: memberForm.address || undefined,
      city: memberForm.city || undefined,
      state: memberForm.state || undefined,
      zip: memberForm.zip || undefined
    }
    
    // Validate email if provided
    if (formattedData.email && !validateEmail(formattedData.email)) {
      alert('Please enter a valid email address')
      return
    }
    
    try {
      const res = await fetch(`/api/kasa/families/${params.id}/members/${editingMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      })
      if (res.ok) {
        setShowMemberModal(false)
        setEditingMember(null)
        setMemberForm({ 
          firstName: '', hebrewFirstName: '', lastName: '', hebrewLastName: '', 
          birthDate: '', hebrewBirthDate: '', gender: '', weddingDate: '', 
          spouseName: '', spouseFirstName: '', spouseHebrewName: '', 
          spouseFatherHebrewName: '', spouseCellPhone: '', phone: '', 
          email: '', address: '', city: '', state: '', zip: '' 
        })
        if (memberForm.weddingDate) {
          alert(`Wedding date set. ${memberForm.firstName} ${memberForm.lastName} will be automatically converted to a new family on ${new Date(memberForm.weddingDate).toLocaleDateString()}.`)
        }
        fetchFamilyDetails()
      } else {
        const error = await res.json()
        console.error('Update error response:', error)
        alert(`Error: ${error.error || error.details || 'Failed to update member'}`)
      }
    } catch (error: any) {
      console.error('Error updating member:', error)
      alert(`Error updating member: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDeleteMember = async (member: any) => {
    if (!confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}?`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/kasa/families/${params.id}/members/${member._id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchFamilyDetails()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      alert('Error deleting member')
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Skip if using Stripe (Stripe handles its own submission)
    if (paymentForm.paymentMethod === 'credit_card' && useStripe) {
      return
    }
    
    // Validate amount
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    // Validate member selection if payment is for a member
    if (paymentForm.paymentFor === 'member' && !paymentForm.memberId) {
      alert('Please select a member for this payment')
      return
    }

    // Handle charging saved card
    if (paymentForm.paymentMethod === 'credit_card' && paymentForm.useSavedCard && paymentForm.selectedSavedCardId) {
      try {
        const res = await fetch(`/api/kasa/families/${params.id}/charge-saved-card`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              savedPaymentMethodId: paymentForm.selectedSavedCardId,
              amount: paymentForm.amount,
              paymentDate: paymentForm.paymentDate,
              year: paymentForm.year,
              type: paymentForm.type,
              notes: paymentForm.notes,
              paymentFrequency: paymentForm.paymentFrequency,
              memberId: paymentForm.paymentFor === 'member' && paymentForm.memberId ? paymentForm.memberId : undefined
            })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          setShowPaymentModal(false)
          setUseStripe(false)
          setPaymentForm({
            amount: 0,
            paymentDate: new Date().toISOString().split('T')[0],
            year: new Date().getFullYear(),
            type: 'membership',
            paymentMethod: 'cash',
            paymentFrequency: 'one-time',
            paymentFor: 'family',
            memberId: '',
            saveCard: false,
            useSavedCard: false,
            selectedSavedCardId: '',
            ccLast4: '',
            ccCardType: '',
            ccExpiryMonth: '',
            ccExpiryYear: '',
            ccNameOnCard: '',
            checkNumber: '',
            checkBankName: '',
            checkRoutingNumber: '',
            notes: ''
          })
          fetchFamilyDetails()
          fetchSavedPaymentMethods()
        } else {
          alert(`Error charging card: ${data.error || 'Unknown error'}`)
        }
      } catch (error: any) {
        console.error('Error charging saved card:', error)
        alert('Error charging saved card. Please check the console for details.')
      }
      return
    }
    
    // Debug: Log form state
    console.log('Form state before submission:', paymentForm)
    console.log('Payment method from form:', paymentForm.paymentMethod)
    
    try {
      // Build payment data based on payment method
      // Ensure paymentMethod is explicitly set and never falls back to cash unless truly missing
      const selectedPaymentMethod = paymentForm.paymentMethod || 'cash'
      
      const paymentData: any = {
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        year: paymentForm.year,
        type: paymentForm.type,
        paymentMethod: selectedPaymentMethod,
        paymentFrequency: paymentForm.paymentFrequency,
        notes: paymentForm.notes || undefined
      }

      // Add memberId if payment is for a member
      if (paymentForm.paymentFor === 'member' && paymentForm.memberId) {
        paymentData.memberId = paymentForm.memberId
      }

      // Add credit card info if payment method is credit_card
      if (selectedPaymentMethod === 'credit_card') {
        // Only add ccInfo if at least last4 is provided
        if (paymentForm.ccLast4) {
          paymentData.ccInfo = {
            last4: paymentForm.ccLast4,
            cardType: paymentForm.ccCardType || undefined,
            expiryMonth: paymentForm.ccExpiryMonth || undefined,
            expiryYear: paymentForm.ccExpiryYear || undefined,
            nameOnCard: paymentForm.ccNameOnCard || undefined
          }
        }
      }

      // Add check info if payment method is check
      if (selectedPaymentMethod === 'check') {
        // Only add checkInfo if at least checkNumber is provided
        if (paymentForm.checkNumber) {
          paymentData.checkInfo = {
            checkNumber: paymentForm.checkNumber,
            bankName: paymentForm.checkBankName || undefined,
            routingNumber: paymentForm.checkRoutingNumber || undefined
          }
        }
      }

      console.log('Submitting payment data:', paymentData)
      
      const res = await fetch('/api/kasa/families/' + params.id + '/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentData, familyId: params.id })
      })
      
      if (res.ok) {
        setShowPaymentModal(false)
        setPaymentForm({
          amount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          year: new Date().getFullYear(),
          type: 'membership',
          paymentMethod: 'cash',
          paymentFrequency: 'one-time',
          paymentFor: 'family',
          memberId: '',
          saveCard: false,
          useSavedCard: false,
          selectedSavedCardId: '',
          ccLast4: '',
          ccCardType: '',
          ccExpiryMonth: '',
          ccExpiryYear: '',
          ccNameOnCard: '',
          checkNumber: '',
          checkBankName: '',
          checkRoutingNumber: '',
          notes: ''
        })
        fetchFamilyDetails()
        fetchSavedPaymentMethods()
        // Refresh member financials if viewing a member
        if (viewingMemberId && memberActiveTab === 'payments') {
          fetchMemberFinancials()
        }
      } else {
        const errorData = await res.json()
        alert(`Error adding payment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('Error adding payment. Please check the console for details.')
    }
  }


  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/kasa/families/' + params.id + '/lifecycle-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventForm, familyId: params.id })
      })
      if (res.ok) {
        setShowEventModal(false)
        // Reset to first event type from database
        if (lifecycleEventTypes.length > 0) {
          setEventForm({
            eventType: lifecycleEventTypes[0].type as any,
            amount: lifecycleEventTypes[0].amount,
            eventDate: new Date().toISOString().split('T')[0],
            year: new Date().getFullYear(),
            notes: ''
          })
        } else {
          setEventForm({
            eventType: 'chasena' as any,
            amount: 0,
            eventDate: new Date().toISOString().split('T')[0],
            year: new Date().getFullYear(),
            notes: ''
          })
        }
        fetchFamilyDetails()
      }
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const updateEventAmount = (type: string) => {
    const amounts: Record<string, number> = {
      chasena: 12180,
      bar_mitzvah: 1800,
      birth_boy: 500,
      birth_girl: 500
    }
    setEventForm({ ...eventForm, eventType: type as any, amount: amounts[type] || 0 })
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  if (!data || !data.family) {
    return <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Family not found</h1>
        <p className="text-gray-600">The family you're looking for doesn't exist or couldn't be loaded.</p>
        <button
          onClick={() => router.push('/families')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Families
        </button>
      </div>
    </div>
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Families
        </button>

        <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6 border border-white/30">
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">{data.family.name}</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-sm text-gray-600">Wedding Date</p>
              <p className="font-medium">{new Date(data.family.weddingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <p className="font-medium">{getPlanNameById(data.family.paymentPlanId)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="font-medium text-green-600">${data.balance.balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="font-medium">{data.members.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="font-medium text-green-600">${data.balance.totalPayments.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lifecycle Events</p>
              <p className="font-medium text-blue-600">${data.balance.totalLifecyclePayments.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Plan Cost (Annual)</p>
              <p className="font-medium text-orange-600">-${(data.balance.planCost || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mt-3">
          <div className="border-b">
            <nav className="flex">
              {[
                { id: 'info', label: 'Info' },
                { id: 'members', label: 'Members' },
                { id: 'payments', label: 'Payments' },
                { id: 'events', label: 'Lifecycle Events' },
                { id: 'statements', label: 'Statements' },
                { id: 'sub-families', label: 'Sub-Families' },
                { id: 'relationships', label: 'Relationships' },
                { id: 'history', label: 'History' },
                { id: 'notes', label: 'Notes' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div>
                <div className="flex justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Family Information</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/audit-logs?entityType=family&entityId=${params.id}`)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all text-sm"
                      title="View audit logs for this family"
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4" />
                      View History
                    </button>
                    <button
                      onClick={() => {
                        if (data?.family) {
                          setInfoForm({
                            name: data.family.name || '',
                            hebrewName: data.family.hebrewName || '',
                            weddingDate: data.family.weddingDate ? new Date(data.family.weddingDate).toISOString().split('T')[0] : '',
                            husbandFirstName: data.family.husbandFirstName || '',
                            husbandHebrewName: data.family.husbandHebrewName || '',
                            husbandFatherHebrewName: data.family.husbandFatherHebrewName || '',
                            wifeFirstName: data.family.wifeFirstName || '',
                            wifeHebrewName: data.family.wifeHebrewName || '',
                            wifeFatherHebrewName: data.family.wifeFatherHebrewName || '',
                            husbandCellPhone: data.family.husbandCellPhone || '',
                            wifeCellPhone: data.family.wifeCellPhone || '',
                            address: data.family.address || '',
                            street: data.family.street || '',
                            phone: data.family.phone || '',
                            email: data.family.email || '',
                            city: data.family.city || '',
                            state: data.family.state || '',
                            zip: data.family.zip || '',
                            paymentPlanId: data.family.paymentPlanId?.toString() || '',
                            receiveEmails: data.family.receiveEmails !== false,
                            receiveSMS: data.family.receiveSMS !== false
                          })
                          setShowInfoModal(true)
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit Info
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* Basic Information */}
                  <div className="glass-strong rounded-lg p-4 border border-white/30">
                    <h4 className="text-base font-semibold mb-2 text-gray-800">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Family Name</label>
                        {renderEditableField(
                          'name',
                          <p className="text-base font-semibold text-gray-900">{data.family.name || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'name'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Family Name (Hebrew)</label>
                        {renderEditableField(
                          'hebrewName',
                          <p className="text-base font-semibold text-gray-900" dir="rtl">{data.family.hebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'hebrew'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Wedding Date</label>
                        {renderEditableField(
                          'weddingDate',
                          <p className="text-base font-semibold text-gray-900">{data.family.weddingDate ? new Date(data.family.weddingDate).toLocaleDateString() : <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'date'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Payment Plan</label>
                        {renderEditableField(
                          'paymentPlanId',
                          <p className="text-base font-semibold text-gray-900">{getPlanNameById(data.family.paymentPlanId)}</p>,
                          'select',
                          paymentPlans.map(plan => ({ value: plan._id, label: plan.name }))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Husband Information */}
                  <div className="glass-strong rounded-lg p-4 border border-white/30">
                    <h4 className="text-base font-semibold mb-2 text-gray-800">Husband Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">First Name</label>
                        {renderEditableField(
                          'husbandFirstName',
                          <p className="text-base font-semibold text-gray-900">{data.family.husbandFirstName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'name'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Hebrew Name</label>
                        {renderEditableField(
                          'husbandHebrewName',
                          <p className="text-base font-semibold text-gray-900" dir="rtl">{data.family.husbandHebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'hebrew'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Father's Hebrew Name</label>
                        {renderEditableField(
                          'husbandFatherHebrewName',
                          <p className="text-base font-semibold text-gray-900" dir="rtl">{data.family.husbandFatherHebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'hebrew'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Cell Phone</label>
                        {renderEditableField(
                          'husbandCellPhone',
                          <p className="text-base font-semibold text-gray-900">{data.family.husbandCellPhone || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'phone'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wife Information */}
                  <div className="glass-strong rounded-lg p-4 border border-white/30">
                    <h4 className="text-base font-semibold mb-2 text-gray-800">Wife Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">First Name</label>
                        {renderEditableField(
                          'wifeFirstName',
                          <p className="text-base font-semibold text-gray-900">{data.family.wifeFirstName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'name'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Hebrew Name</label>
                        {renderEditableField(
                          'wifeHebrewName',
                          <p className="text-base font-semibold text-gray-900" dir="rtl">{data.family.wifeHebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'hebrew'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Father's Hebrew Name</label>
                        {renderEditableField(
                          'wifeFatherHebrewName',
                          <p className="text-base font-semibold text-gray-900" dir="rtl">{data.family.wifeFatherHebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'hebrew'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Cell Phone</label>
                        {renderEditableField(
                          'wifeCellPhone',
                          <p className="text-base font-semibold text-gray-900">{data.family.wifeCellPhone || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'phone'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="glass-strong rounded-lg p-4 border border-white/30">
                    <h4 className="text-base font-semibold mb-2 text-gray-800">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Email</label>
                        {renderEditableField(
                          'email',
                          <p className="text-base font-semibold text-gray-900">{data.family.email || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'email'
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Phone</label>
                        {renderEditableField(
                          'phone',
                          <p className="text-base font-semibold text-gray-900">{data.family.phone || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                          'phone'
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Street Address</label>
                        {renderEditableField(
                          'street',
                          <p className="text-base font-semibold text-gray-900">{data.family.street || data.family.address || <span className="text-gray-400 font-normal">Not provided</span>}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">City</label>
                        {renderEditableField(
                          'city',
                          <p className="text-base font-semibold text-gray-900">{data.family.city || <span className="text-gray-400 font-normal">Not provided</span>}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">State</label>
                        {renderEditableField(
                          'state',
                          <p className="text-base font-semibold text-gray-900">{data.family.state || <span className="text-gray-400 font-normal">Not provided</span>}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">ZIP Code</label>
                        {renderEditableField(
                          'zip',
                          <p className="text-base font-semibold text-gray-900">{data.family.zip || <span className="text-gray-400 font-normal">Not provided</span>}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                {viewingMemberId && data.members.find((m: any) => m._id === viewingMemberId) ? (
                  // Member Detail View (Full Screen)
                  (() => {
                    const member = data.members.find((m: any) => m._id === viewingMemberId)
                    if (!member) return null
                    
                    // Calculate Hebrew date if missing
                    let displayHebrewDate = member.hebrewBirthDate
                    if (!displayHebrewDate && member.birthDate) {
                      displayHebrewDate = convertToHebrewDate(new Date(member.birthDate))
                    }
                    
                    // Calculate age
                    let age: number
                    if (displayHebrewDate) {
                      const hebrewAge = calculateHebrewAge(displayHebrewDate)
                      if (hebrewAge !== null) {
                        age = hebrewAge
                      } else {
                        const today = new Date()
                        const birthDate = new Date(member.birthDate)
                        age = today.getFullYear() - birthDate.getFullYear()
                        const monthDiff = today.getMonth() - birthDate.getMonth()
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                          age--
                        }
                      }
                    } else {
                      const today = new Date()
                      const birthDate = new Date(member.birthDate)
                      age = today.getFullYear() - birthDate.getFullYear()
                      const monthDiff = today.getMonth() - birthDate.getMonth()
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--
                      }
                    }
                    
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <button
                              onClick={() => {
                                setViewingMemberId(null)
                                setMemberActiveTab('info')
                              }}
                              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
                            >
                              ← Back to Members List
                            </button>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {member.firstName} {member.lastName} - Details
                            </h3>
                          </div>
                        </div>
                        
                        {/* Member Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-gray-200">
                          <button
                            onClick={() => setMemberActiveTab('info')}
                            className={`px-4 py-2 font-medium transition-colors ${
                              memberActiveTab === 'info'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Info
                          </button>
                          <button
                            onClick={() => setMemberActiveTab('balance')}
                            className={`px-4 py-2 font-medium transition-colors ${
                              memberActiveTab === 'balance'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Balance
                          </button>
                          <button
                            onClick={() => setMemberActiveTab('payments')}
                            className={`px-4 py-2 font-medium transition-colors ${
                              memberActiveTab === 'payments'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Payments
                          </button>
                          <button
                            onClick={() => setMemberActiveTab('statements')}
                            className={`px-4 py-2 font-medium transition-colors ${
                              memberActiveTab === 'statements'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Statements
                          </button>
                        </div>

                        {memberActiveTab === 'info' && (
                        <div className="space-y-4">
                          {/* Basic Information */}
                          <div className="glass-strong rounded-lg p-4 border border-white/30">
                            <h4 className="text-base font-semibold mb-3 text-gray-800">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">First Name</label>
                                {renderEditableMemberField(
                                  'firstName',
                                  <p className="text-base font-semibold text-gray-900">{member.firstName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'name',
                                  member._id,
                                  undefined
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">First Name (Hebrew)</label>
                                {renderEditableMemberField(
                                  'hebrewFirstName',
                                  <p className="text-base font-semibold text-gray-900" dir="rtl">{member.hebrewFirstName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'hebrew',
                                  member._id,
                                  undefined
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Last Name</label>
                                {renderEditableMemberField(
                                  'lastName',
                                  <p className="text-base font-semibold text-gray-900">{member.lastName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'name',
                                  member._id,
                                  undefined
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Last Name (Hebrew)</label>
                                {renderEditableMemberField(
                                  'hebrewLastName',
                                  <p className="text-base font-semibold text-gray-900" dir="rtl">{member.hebrewLastName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'hebrew',
                                  member._id,
                                  undefined
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Gender</label>
                                {renderEditableMemberField(
                                  'gender',
                                  <p className="text-base font-semibold text-gray-900 capitalize">{member.gender || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'select',
                                  member._id,
                                  [
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' }
                                  ]
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Birth Information */}
                          <div className="glass-strong rounded-lg p-4 border border-white/30">
                            <h4 className="text-base font-semibold mb-3 text-gray-800">Birth Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Birth Date</label>
                                {renderEditableMemberField(
                                  'birthDate',
                                  <p className="text-base font-semibold text-gray-900">{member.birthDate ? new Date(member.birthDate).toLocaleDateString() : <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'date',
                                  member._id,
                                  undefined
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Hebrew Birth Date (Auto-calculated)</label>
                                <div className="border border-gray-200 rounded px-3 py-2">
                                  <p className="text-base font-semibold text-gray-900" dir="rtl">{displayHebrewDate || <span className="text-gray-400 font-normal">Not provided</span>}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Current Age</label>
                                <div className="border border-gray-200 rounded px-3 py-2">
                                  <p className="text-base font-semibold text-gray-900">{age} years</p>
                                </div>
                              </div>
                              {member.barMitzvahDate && (
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Bar/Bat Mitzvah Date</label>
                                  <div className="border border-gray-200 rounded px-3 py-2">
                                    <p className="text-base font-semibold text-gray-900">{new Date(member.barMitzvahDate).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Marriage Information - Show if age >= 18 or if fields have values */}
                          {(age >= 18 || member.weddingDate || member.spouseName || member.spouseFirstName || member.email || member.address || member.phone) && (
                            <div className="glass-strong rounded-lg p-4 border border-white/30">
                              <h4 className="text-base font-semibold mb-3 text-gray-800">Marriage Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Wedding Date</label>
                                  {renderEditableMemberField(
                                    'weddingDate',
                                    <p className="text-base font-semibold text-gray-900">{member.weddingDate ? new Date(member.weddingDate).toLocaleDateString() : <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'date',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Spouse First Name</label>
                                  {renderEditableMemberField(
                                    'spouseFirstName',
                                    <p className="text-base font-semibold text-gray-900">{member.spouseFirstName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'name',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Spouse Hebrew Name</label>
                                  {renderEditableMemberField(
                                    'spouseHebrewName',
                                    <p className="text-base font-semibold text-gray-900" dir="rtl">{member.spouseHebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'hebrew',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Spouse Father's Hebrew Name</label>
                                  {renderEditableMemberField(
                                    'spouseFatherHebrewName',
                                    <p className="text-base font-semibold text-gray-900" dir="rtl">{member.spouseFatherHebrewName || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'hebrew',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Spouse Cell Phone</label>
                                  {renderEditableMemberField(
                                    'spouseCellPhone',
                                    <p className="text-base font-semibold text-gray-900">{member.spouseCellPhone || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'phone',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Phone</label>
                                {renderEditableMemberField(
                                  'phone',
                                  <p className="text-base font-semibold text-gray-900">{member.phone || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'phone',
                                  member._id,
                                  undefined
                                )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Email</label>
                                {renderEditableMemberField(
                                  'email',
                                  <p className="text-base font-semibold text-gray-900">{member.email || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                  'email',
                                  member._id,
                                  undefined
                                )}
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Address</label>
                                  {renderEditableMemberField(
                                    'address',
                                    <p className="text-base font-semibold text-gray-900">{member.address || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'name',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">City</label>
                                  {renderEditableMemberField(
                                    'city',
                                    <p className="text-base font-semibold text-gray-900">{member.city || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'name',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">State</label>
                                  {renderEditableMemberField(
                                    'state',
                                    <p className="text-base font-semibold text-gray-900">{member.state || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'name',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">ZIP Code</label>
                                  {renderEditableMemberField(
                                    'zip',
                                    <p className="text-base font-semibold text-gray-900">{member.zip || <span className="text-gray-400 font-normal">Not provided</span>}</p>,
                                    'text',
                                    member._id,
                                    undefined
                                  )}
                                </div>
                                {/* Keep spouseName for backward compatibility */}
                                {member.spouseName && !member.spouseFirstName && (
                                  <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1 block uppercase tracking-wide">Spouse Name (Legacy)</label>
                                  {renderEditableMemberField(
                                    'spouseName',
                                    <p className="text-base font-semibold text-gray-900">{member.spouseName}</p>,
                                    'name',
                                    member._id,
                                    undefined
                                  )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                setEditingMember(member)
                                setMemberForm({
                                  firstName: member.firstName,
                                  hebrewFirstName: member.hebrewFirstName || '',
                                  lastName: member.lastName,
                                  hebrewLastName: member.hebrewLastName || '',
                                  birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
                                  hebrewBirthDate: member.hebrewBirthDate || '',
                                  gender: member.gender || '',
                                  weddingDate: member.weddingDate ? new Date(member.weddingDate).toISOString().split('T')[0] : '',
                                  spouseName: member.spouseName || '',
                                  spouseFirstName: member.spouseFirstName || '',
                                  spouseHebrewName: member.spouseHebrewName || '',
                                  spouseFatherHebrewName: member.spouseFatherHebrewName || '',
                                  spouseCellPhone: member.spouseCellPhone || '',
                                  phone: member.phone || '',
                                  email: member.email || '',
                                  address: member.address || '',
                                  city: member.city || '',
                                  state: member.state || '',
                                  zip: member.zip || ''
                                })
                                setShowMemberModal(true)
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Open Full Edit Modal
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Delete Member
                            </button>
                          </div>
                        </div>
                        )}

                        {memberActiveTab === 'balance' && (
                          <div>
                            {loadingMemberFinancials ? (
                              <div className="text-center py-12">
                                <p className="text-gray-500">Loading balance...</p>
                              </div>
                            ) : memberBalance ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="glass-strong rounded-lg p-6 border border-white/30">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Plan Cost (Annual)</p>
                                    <p className="text-2xl font-bold text-gray-900">${memberBalance.planCost?.toLocaleString() || 0}</p>
                                  </div>
                                  <div className="glass-strong rounded-lg p-6 border border-white/30">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Total Payments</p>
                                    <p className="text-2xl font-bold text-green-600">${memberBalance.totalPayments?.toLocaleString() || 0}</p>
                                  </div>
                                  <div className={`glass-strong rounded-lg p-6 border border-white/30 ${memberBalance.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Current Balance</p>
                                    <p className={`text-2xl font-bold ${memberBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ${memberBalance.balance?.toLocaleString() || 0}
                                    </p>
                                  </div>
                                </div>
                                {memberBalance.totalLifecyclePayments > 0 && (
                                  <div className="glass-strong rounded-lg p-4 border border-white/30">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Lifecycle Events (Informational)</p>
                                    <p className="text-lg font-semibold text-gray-900">${memberBalance.totalLifecyclePayments?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Note: Lifecycle events are not included in balance calculation</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-12 glass rounded-xl border border-white/20">
                                <p className="text-gray-500">No balance data available</p>
                              </div>
                            )}
                          </div>
                        )}

                        {memberActiveTab === 'payments' && (
                          <div>
                            <div className="flex justify-between mb-4">
                              <h3 className="text-lg font-semibold">Payments</h3>
                              <button
                                onClick={() => {
                                  setPaymentForm({
                                    ...paymentForm,
                                    paymentFor: 'member',
                                    memberId: member._id
                                  })
                                  setShowPaymentModal(true)
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Add Payment
                              </button>
                            </div>
                            {loadingMemberFinancials ? (
                              <div className="text-center py-12">
                                <p className="text-gray-500">Loading payments...</p>
                              </div>
                            ) : memberPayments.length === 0 ? (
                              <div className="text-center py-12 glass rounded-xl border border-white/20">
                                <div className="text-4xl mb-4">💳</div>
                                <p className="text-gray-500">No payments found for this member.</p>
                              </div>
                            ) : (
                              <div className="glass-strong rounded-xl overflow-hidden border border-white/30">
                                <table className="min-w-full">
                                  <thead className="bg-white/20 backdrop-blur-sm">
                                    <tr>
                                      <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                                      <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                                      <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                                      <th className="text-left p-4 font-semibold text-gray-700">Payment Method</th>
                                      <th className="text-left p-4 font-semibold text-gray-700">Year</th>
                                      <th className="text-left p-4 font-semibold text-gray-700">Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white/10 divide-y divide-white/20">
                                    {memberPayments.slice((memberPaymentsPage - 1) * itemsPerPage, memberPaymentsPage * itemsPerPage).map((payment: any) => {
                                      const formatPaymentMethod = () => {
                                        if (!payment.paymentMethod) return 'Cash'
                                        const methodLabels: { [key: string]: string } = {
                                          cash: 'Cash',
                                          credit_card: payment.ccInfo?.last4 ? `Credit Card •••• ${payment.ccInfo.last4}` : 'Credit Card',
                                          check: payment.checkInfo?.checkNumber ? `Check #${payment.checkInfo.checkNumber}` : 'Check',
                                          quick_pay: 'Quick Pay'
                                        }
                                        return methodLabels[payment.paymentMethod] || payment.paymentMethod
                                      }
                                      return (
                                        <tr key={payment._id} className="hover:bg-white/20 transition-colors">
                                          <td className="p-4">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                          <td className="p-4 font-medium">${payment.amount.toLocaleString()}</td>
                                          <td className="p-4 capitalize">{payment.type}</td>
                                          <td className="p-4">
                                            <div className="text-sm">{formatPaymentMethod()}</div>
                                            {payment.paymentMethod === 'credit_card' && payment.ccInfo?.cardType && (
                                              <div className="text-xs text-gray-500">{payment.ccInfo.cardType}</div>
                                            )}
                                            {payment.paymentMethod === 'check' && payment.checkInfo?.bankName && (
                                              <div className="text-xs text-gray-500">{payment.checkInfo.bankName}</div>
                                            )}
                                          </td>
                                          <td className="p-4">{payment.year}</td>
                                          <td className="p-4 text-gray-600">{payment.notes || '-'}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                                {memberPayments.length > 0 && (
                                  <Pagination
                                    currentPage={memberPaymentsPage}
                                    totalPages={Math.ceil(memberPayments.length / itemsPerPage)}
                                    totalItems={memberPayments.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setMemberPaymentsPage}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {memberActiveTab === 'statements' && (
                          <div>
                            {loadingMemberFinancials ? (
                              <div className="text-center py-12">
                                <p className="text-gray-500">Loading statements...</p>
                              </div>
                            ) : memberStatements.length === 0 ? (
                              <div className="text-center py-12 glass rounded-xl border border-white/20">
                                <div className="text-4xl mb-4">📄</div>
                                <p className="text-gray-500">No statements found for this member.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {memberStatements.map((statement) => (
                                  <div key={statement._id} className="glass rounded-xl p-6 border border-white/20">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <h4 className="font-semibold text-lg">{statement.statementNumber}</h4>
                                        <p className="text-sm text-gray-500">
                                          {new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Generated: {new Date(statement.date).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-gray-500">Closing Balance</div>
                                        <div className="text-xl font-bold">${statement.closingBalance.toLocaleString()}</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
                                      <div>
                                        <p className="text-xs text-gray-500">Opening Balance</p>
                                        <p className="text-sm font-semibold">${statement.openingBalance.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Income</p>
                                        <p className="text-sm font-semibold text-green-600">${statement.income.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Expenses</p>
                                        <p className="text-sm font-semibold text-red-600">${statement.expenses.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Closing Balance</p>
                                        <p className="text-sm font-semibold">${statement.closingBalance.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  // Members List View
                  <>
                    <div className="flex justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">Family Members (Children)</h3>
                        <p className="text-sm text-gray-600">Add children to track their ages for payment plan calculations</p>
                      </div>
                      <button
                        onClick={() => {
                          const familyLastName = getFamilyLastName()
                          setMemberForm({ 
                            firstName: '', 
                            hebrewFirstName: '',
                            lastName: familyLastName, 
                            hebrewLastName: '',
                            birthDate: '', 
                            hebrewBirthDate: '', 
                            gender: '',
                            weddingDate: '',
                            spouseName: '',
                            spouseFirstName: '',
                            spouseHebrewName: '',
                            spouseFatherHebrewName: '',
                            spouseCellPhone: '',
                            phone: '',
                            email: '',
                            address: '',
                            city: '',
                            state: '',
                            zip: ''
                          })
                          setEditingMember(null)
                          setShowMemberModal(true)
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Add Child
                      </button>
                    </div>
                    {data.members.length === 0 ? (
                  <div className="text-center py-12 glass rounded-xl border border-white/20">
                    <div className="text-4xl mb-4">👶</div>
                    <p className="text-gray-600 mb-4">No children added yet</p>
                    <button
                      onClick={() => {
                        const familyLastName = getFamilyLastName()
                        setMemberForm({ 
                          firstName: '', 
                          hebrewFirstName: '',
                          lastName: familyLastName, 
                          hebrewLastName: '',
                          birthDate: '', 
                          hebrewBirthDate: '', 
                          gender: '',
                          weddingDate: '',
                          spouseName: '',
                          spouseFirstName: '',
                          spouseHebrewName: '',
                          spouseFatherHebrewName: '',
                          spouseCellPhone: '',
                          phone: '',
                          email: '',
                          address: '',
                          city: '',
                          state: '',
                          zip: ''
                        })
                        setEditingMember(null)
                        setShowMemberModal(true)
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all"
                    >
                      Add First Child
                    </button>
                  </div>
                ) : (
                  <div className="glass-strong rounded-xl overflow-hidden border border-white/30">
                    <table className="min-w-full">
                      <thead className="bg-white/20 backdrop-blur-sm">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Birth Date</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Hebrew Date</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Current Age</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Payment Plan</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Gender</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/10 divide-y divide-white/20">
                        {data.members.slice((membersPage - 1) * itemsPerPage, membersPage * itemsPerPage).map((member) => {
                          // Calculate Hebrew date if missing (for display)
                          let displayHebrewDate = member.hebrewBirthDate
                          if (!displayHebrewDate && member.birthDate) {
                            displayHebrewDate = convertToHebrewDate(new Date(member.birthDate))
                          }
                          
                          // Use Hebrew age if available, otherwise use Gregorian age
                          let age: number
                          if (displayHebrewDate) {
                            const hebrewAge = calculateHebrewAge(displayHebrewDate)
                            if (hebrewAge !== null) {
                              age = hebrewAge
                            } else {
                              // Fallback to Gregorian age if Hebrew calculation fails
                              const today = new Date()
                              const birthDate = new Date(member.birthDate)
                              age = today.getFullYear() - birthDate.getFullYear()
                              const monthDiff = today.getMonth() - birthDate.getMonth()
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                age--
                              }
                            }
                          } else {
                            // Use Gregorian age
                            const today = new Date()
                            const birthDate = new Date(member.birthDate)
                            age = today.getFullYear() - birthDate.getFullYear()
                            const monthDiff = today.getMonth() - birthDate.getMonth()
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--
                            }
                          }
                          
                          // Payment plan logic:
                          // Only show payment plan if child has been explicitly assigned one
                          let planText = ''
                          let planColor = 'text-gray-500'
                          
                          // Check if member has a payment plan assigned
                          if (member.paymentPlan && member.paymentPlanAssigned) {
                            const assignedPlan = member.paymentPlan
                            const planName = getPlanName(assignedPlan)
                            const planIndex = assignedPlan - 1
                            let planPrice = 0
                            
                            if (planIndex >= 0 && planIndex < paymentPlans.length) {
                              planPrice = paymentPlans[planIndex].yearlyPrice
                            } else {
                              // Fallback prices if plan not found
                              const fallbackPrices: { [key: number]: number } = {
                                1: 1200,
                                2: 1500,
                                3: 1800,
                                4: 2500
                              }
                              planPrice = fallbackPrices[assignedPlan] || 0
                            }
                            
                            planText = `${planName} - $${planPrice.toLocaleString()}`
                            
                            // Set color based on plan number
                            switch (assignedPlan) {
                              case 1:
                                planColor = 'text-blue-600'
                                break
                              case 2:
                                planColor = 'text-green-600'
                                break
                              case 3:
                                planColor = 'text-purple-600'
                                break
                              case 4:
                                planColor = 'text-orange-600'
                                break
                              default:
                                planColor = 'text-gray-600'
                            }
                            
                            // Add Bar Mitzvah indicator for Plan 3 males
                            if (assignedPlan === 3 && displayHebrewDate && member.gender === 'male') {
                              planText += ' ✡️ (Bar Mitzvah)'
                            }
                          }
                          
                          // Show bar/bat mitzvah indicator if applicable
                          if (age === 13 && displayHebrewDate && member.gender === 'male') {
                            planText += ' ✡️ (Bar Mitzvah Age)'
                          } else if (age === 13 && displayHebrewDate && member.gender === 'female') {
                            planText += ' ✡️ (Bat Mitzvah Age)'
                          }
                          
                          return (
                            <tr key={member._id} className="hover:bg-white/20 transition-colors">
                              <td className="p-4">
                                <button
                                  onClick={() => {
                                    setViewingMemberId(viewingMemberId === member._id ? null : member._id)
                                  }}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer text-left"
                                >
                                  {member.firstName} {member.lastName}
                                </button>
                              </td>
                              <td className="p-4 text-gray-600">{new Date(member.birthDate).toLocaleDateString()}</td>
                              <td className="p-4 text-gray-600">
                                {displayHebrewDate ? (
                                  <div>
                                    <div className="font-medium">{displayHebrewDate}</div>
                                    {member.barMitzvahDate && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Bar/Bat Mitzvah: {new Date(member.barMitzvahDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Calculating...</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="font-semibold text-gray-800">{age}</span>
                                <span className="text-gray-500 text-sm ml-1">years</span>
                              </td>
                              <td className={`p-4 font-medium ${planColor}`}>{planText}</td>
                              <td className="p-4 capitalize text-gray-600">{member.gender || '-'}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditMember(member)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit member"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(member)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete member"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                  {member.paymentPlan === 3 && member.paymentPlanAssigned && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-lg" title="Bucher Plan Assigned">
                                      Bucher Plan
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {data.members.length > 0 && (
                      <Pagination
                        currentPage={membersPage}
                        totalPages={Math.ceil(data.members.length / itemsPerPage)}
                        totalItems={data.members.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setMembersPage}
                      />
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-semibold">Payments</h3>
                  <button
                    onClick={() => {
                      setPaymentForm({
                        ...paymentForm,
                        paymentFor: 'family',
                        memberId: ''
                      })
                      setShowPaymentModal(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Payment
                  </button>
                </div>
                {/* Filter to show only family-level payments (no memberId) */}
                {(() => {
                  const familyPayments = data.payments.filter((payment: any) => !payment.memberId)
                  return (
                    <>
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Amount</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Payment Method</th>
                            <th className="text-left p-2">Year</th>
                            <th className="text-left p-2">Notes</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {familyPayments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-gray-500">
                                No family payments found
                              </td>
                            </tr>
                          ) : (
                            familyPayments.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage).map((payment: any) => {
                              const formatPaymentMethod = () => {
                                if (!payment.paymentMethod) return 'Cash'
                                const methodLabels: { [key: string]: string } = {
                                  cash: 'Cash',
                                  credit_card: payment.ccInfo?.last4 ? `Credit Card •••• ${payment.ccInfo.last4}` : 'Credit Card',
                                  check: payment.checkInfo?.checkNumber ? `Check #${payment.checkInfo.checkNumber}` : 'Check',
                                  quick_pay: 'Quick Pay'
                                }
                                return methodLabels[payment.paymentMethod] || payment.paymentMethod
                              }
                              
                              const isRefunded = payment.refundedAmount > 0
                              const remainingAmount = payment.amount - (payment.refundedAmount || 0)
                              
                              return (
                                <tr key={payment._id} className={`border-b ${isRefunded ? 'bg-red-50' : ''}`}>
                                  <td className="p-2">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                    {isRefunded && (
                                      <div className="text-xs text-red-600 mt-1">
                                        {payment.isFullyRefunded ? 'Fully Refunded' : `Refunded: $${payment.refundedAmount.toLocaleString()}`}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 font-medium">
                                    <div className={isRefunded ? 'line-through text-gray-400' : ''}>
                                      ${payment.amount.toLocaleString()}
                                    </div>
                                    {isRefunded && remainingAmount > 0 && (
                                      <div className="text-sm text-green-600 font-semibold mt-1">
                                        Remaining: ${remainingAmount.toLocaleString()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 capitalize">{payment.type}</td>
                                  <td className="p-2">
                                    <div className="text-sm">{formatPaymentMethod()}</div>
                                    {payment.paymentMethod === 'credit_card' && payment.ccInfo?.cardType && (
                                      <div className="text-xs text-gray-500">{payment.ccInfo.cardType}</div>
                                    )}
                                    {payment.paymentMethod === 'check' && payment.checkInfo?.bankName && (
                                      <div className="text-xs text-gray-500">{payment.checkInfo.bankName}</div>
                                    )}
                                  </td>
                                  <td className="p-2">{payment.year}</td>
                                  <td className="p-2 text-gray-600">{payment.notes || '-'}</td>
                                  <td className="p-2">
                                    <div className="flex gap-2 items-center">
                                      {/* Invoice/Receipt Actions */}
                                      <button
                                        onClick={() => window.open(`/api/kasa/payments/${payment._id}/receipt?format=html`, '_blank')}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="View Receipt"
                                      >
                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => window.open(`/api/kasa/payments/${payment._id}/invoice?format=html`, '_blank')}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                        title="View Invoice"
                                      >
                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                      </button>
                                      {/* Refund Button (Admin only) */}
                                      {(user?.role === 'admin' || user?.role === 'super_admin') && remainingAmount > 0 && (
                                        <button
                                          onClick={() => {
                                            const refundAmount = prompt(`Enter refund amount (max: $${remainingAmount.toLocaleString()}):`)
                                            if (refundAmount && parseFloat(refundAmount) > 0) {
                                              handleRefund(payment._id, parseFloat(refundAmount))
                                            }
                                          }}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Process Refund"
                                        >
                                          <RefundIcon className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                      {familyPayments.length > 0 && (
                        <Pagination
                          currentPage={paymentsPage}
                          totalPages={Math.ceil(familyPayments.length / itemsPerPage)}
                          totalItems={familyPayments.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setPaymentsPage}
                        />
                      )}
                    </>
                  )
                })()}
              </div>
            )}


            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-semibold">Lifecycle Events</h3>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Event
                  </button>
                </div>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Event Type</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lifecycleEvents.slice((eventsPage - 1) * itemsPerPage, eventsPage * itemsPerPage).map((event) => (
                      <tr key={event._id} className="border-b">
                        <td className="p-2">{new Date(event.eventDate).toLocaleDateString()}</td>
                        <td className="p-2 capitalize">{event.eventType.replace('_', ' ')}</td>
                        <td className="p-2 font-medium">${event.amount.toLocaleString()}</td>
                        <td className="p-2">{event.year}</td>
                        <td className="p-2 text-gray-600">{event.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.lifecycleEvents.length > 0 && (
                  <Pagination
                    currentPage={eventsPage}
                    totalPages={Math.ceil(data.lifecycleEvents.length / itemsPerPage)}
                    totalItems={data.lifecycleEvents.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setEventsPage}
                  />
                )}
              </div>
            )}

            {activeTab === 'statements' && (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-semibold">Statements</h3>
                  {statements.length > 0 && (
                    <button
                      onClick={() => handlePrintAllStatements()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                      <PrinterIcon className="h-5 w-5" />
                      Print All Statements
                    </button>
                  )}
                </div>
                {statements.length === 0 ? (
                  <div className="text-center py-12 glass rounded-xl border border-white/20">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-gray-500">No statements found for this family.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statements.map((statement) => (
                      <div key={statement._id} className="glass rounded-xl p-6 border border-white/20">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{statement.statementNumber}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Generated: {new Date(statement.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Closing Balance</div>
                            <div className="text-xl font-bold">${statement.closingBalance.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
                          <div>
                            <div className="text-xs text-gray-500">Opening Balance</div>
                            <div className="font-medium">${statement.openingBalance.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Income</div>
                            <div className="font-medium text-green-600">${statement.income.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Withdrawals</div>
                            <div className="font-medium text-orange-600">${statement.withdrawals.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Expenses</div>
                            <div className="font-medium text-red-600">${statement.expenses.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                          <button
                            onClick={() => handlePrintStatement(statement)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                          >
                            <PrinterIcon className="h-4 w-4" />
                            Print
                          </button>
                          <button
                            onClick={() => handleSavePDFStatement(statement)}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            Save as PDF
                          </button>
                          {data?.family?.email && (
                            <button
                              onClick={() => handleSendStatementEmail(statement)}
                              disabled={sendingEmail === statement._id}
                              className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm disabled:opacity-50"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                              {sendingEmail === statement._id ? 'Sending...' : 'Send Email'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'sub-families' && (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-semibold">Sub-Families</h3>
                  <p className="text-sm text-gray-500">
                    Families created from members of this family
                  </p>
                </div>
                {loadingSubFamilies ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-gray-500 mt-4">Loading sub-families...</p>
                  </div>
                ) : subFamilies.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                    <p className="text-gray-600 font-medium mb-2">No sub-families found</p>
                    <p className="text-sm text-gray-500">
                      When members of this family get married and are converted to their own families, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subFamilies.map((subFamily: any) => (
                      <div
                        key={subFamily._id}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{subFamily.name}</h4>
                              {subFamily.hebrewName && (
                                <span className="text-sm text-gray-500" dir="rtl" style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}>
                                  {subFamily.hebrewName}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <div className="text-xs text-gray-500">Wedding Date</div>
                                <div className="font-medium">
                                  {subFamily.weddingDate ? new Date(subFamily.weddingDate).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              {subFamily.husbandFirstName && (
                                <div>
                                  <div className="text-xs text-gray-500">Husband</div>
                                  <div className="font-medium">{subFamily.husbandFirstName}</div>
                                </div>
                              )}
                              {subFamily.wifeFirstName && (
                                <div>
                                  <div className="text-xs text-gray-500">Wife</div>
                                  <div className="font-medium">{subFamily.wifeFirstName}</div>
                                </div>
                              )}
                              {subFamily.email && (
                                <div>
                                  <div className="text-xs text-gray-500">Email</div>
                                  <div className="font-medium text-sm">{subFamily.email}</div>
                                </div>
                              )}
                            </div>
                            {subFamily.address && (
                              <div className="mt-3 text-sm text-gray-600">
                                <span className="text-gray-500">Address: </span>
                                {subFamily.address}
                                {subFamily.city && `, ${subFamily.city}`}
                                {subFamily.state && `, ${subFamily.state}`}
                                {subFamily.zip && ` ${subFamily.zip}`}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <a
                              href={`/families/${subFamily._id}`}
                              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                            >
                              View Details
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'relationships' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Family Relationships</h3>
                    <p className="text-sm text-gray-500">Link this family to related families</p>
                  </div>
                  <button
                    onClick={() => {
                      setRelationshipForm({
                        relatedFamilyId: '',
                        relationshipType: 'related',
                        customType: '',
                        notes: ''
                      })
                      setShowRelationshipModal(true)
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Relationship
                  </button>
                </div>

                {loadingRelationships ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-gray-500 mt-4">Loading relationships...</p>
                  </div>
                ) : relationships.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium mb-2">No relationships found</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Link this family to related families to track connections.
                    </p>
                    <button
                      onClick={() => {
                        setRelationshipForm({
                          relatedFamilyId: '',
                          relationshipType: 'related',
                          customType: '',
                          notes: ''
                        })
                        setShowRelationshipModal(true)
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Relationship
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relationships.map((rel: any) => (
                      <div key={rel._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-800">
                                {rel.family1Name || rel.family2Name || 'Unknown Family'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                                {rel.relationshipType === 'custom' ? rel.customType : rel.relationshipType}
                              </span>
                            </div>
                            {rel.notes && (
                              <p className="text-sm text-gray-600 mt-2">{rel.notes}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Created: {new Date(rel.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteRelationship(rel._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Family History Timeline</h3>
                  <p className="text-sm text-gray-500">Complete activity timeline for this family</p>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-gray-500 mt-4">Loading history...</p>
                  </div>
                ) : !history || !history.timeline || history.timeline.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium mb-2">No history found</p>
                    <p className="text-sm text-gray-500">
                      History will appear here as activities are recorded.
                    </p>
                  </div>
                ) : (
                  <div>
                    {history.stats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Total Events</p>
                          <p className="text-2xl font-bold text-blue-600">{history.stats.totalEvents}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Payments</p>
                          <p className="text-2xl font-bold text-green-600">{history.stats.payments}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Members</p>
                          <p className="text-2xl font-bold text-purple-600">{history.stats.members}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Lifecycle Events</p>
                          <p className="text-2xl font-bold text-orange-600">{history.stats.lifecycleEvents}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {history.timeline.map((event: any, index: number) => (
                        <div key={index} className="flex gap-4 p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-800">{event.description || event.action}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {event.type === 'payment' && event.amount && (
                                    <span className="text-green-600 font-medium">${event.amount.toLocaleString()}</span>
                                  )}
                                  {event.type === 'lifecycle_event' && event.eventType && (
                                    <span className="text-purple-600 capitalize">{event.eventType.replace('_', ' ')}</span>
                                  )}
                                  {event.user && (
                                    <span className="text-gray-500"> by {event.user}</span>
                                  )}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(event.date).toLocaleString()}
                              </span>
                            </div>
                            {event.changes && (
                              <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
                                <pre className="whitespace-pre-wrap">{JSON.stringify(event.changes, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Notes</h3>
                    <p className="text-sm text-gray-500">Add and manage notes for this family</p>
                  </div>
                  <button
                    onClick={handleAddNote}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Note
                  </button>
                </div>

                {loadingNotes ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-gray-500 mt-4">Loading notes...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-600 font-medium mb-2">No notes yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Add notes to keep track of important information about this family.
                    </p>
                    <button
                      onClick={handleAddNote}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Note
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <span className="sr-only">Checked</span>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Note
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Checked
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {notes.map((note: any) => (
                          <tr 
                            key={note._id} 
                            className={note.checked ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleChecked(note)}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                  note.checked
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                                title={note.checked ? 'Mark as unchecked' : 'Mark as checked'}
                              >
                                {note.checked && <CheckIcon className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                {note.note}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(note.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {note.checked ? (
                                <div>
                                  <div className="text-sm text-gray-500">
                                    {note.checkedAt ? new Date(note.checkedAt).toLocaleDateString() : 'N/A'}
                                  </div>
                                  {note.checkedBy && (
                                    <div className="text-xs text-gray-400">
                                      by {note.checkedBy}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Not checked</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditNote(note)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="Edit note"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note._id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete note"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showMemberModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                {editingMember ? 'Edit Child' : 'Add Child'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">Add a child to the family</p>
              <form onSubmit={editingMember ? handleUpdateMember : handleAddMember} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={memberForm.firstName}
                    onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                    onBlur={(e) => {
                      if (e.target.value) {
                        setMemberForm({ ...memberForm, firstName: capitalizeName(e.target.value) })
                      }
                    }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">First Name (Hebrew) *</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    lang="he"
                    inputMode="text"
                    value={memberForm.hebrewFirstName}
                    onChange={(e) => setMemberForm({ ...memberForm, hebrewFirstName: e.target.value })}
                    onKeyDown={(e) => handleHebrewInput(e, memberForm.hebrewFirstName, (value) => setMemberForm({ ...memberForm, hebrewFirstName: value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-right font-hebrew"
                    placeholder="שם פרטי בעברית"
                    style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                  />
                </div>
                {editingMember && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={memberForm.lastName}
                      onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                      onBlur={(e) => {
                        if (e.target.value) {
                          setMemberForm({ ...memberForm, lastName: capitalizeName(e.target.value) })
                        }
                      }}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter last name"
                    />
                  </div>
                )}
                {editingMember && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Last Name (Hebrew) *</label>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      lang="he"
                      inputMode="text"
                      value={memberForm.hebrewLastName}
                      onChange={(e) => setMemberForm({ ...memberForm, hebrewLastName: e.target.value })}
                      onKeyDown={(e) => handleHebrewInput(e, memberForm.hebrewLastName, (value) => setMemberForm({ ...memberForm, hebrewLastName: value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-right font-hebrew"
                      placeholder="שם משפחה בעברית"
                      style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Birth Date (Gregorian) *</label>
                  <input
                    type="date"
                    required
                    value={memberForm.birthDate}
                    onChange={(e) => {
                      const gregorianDate = e.target.value
                      // Auto-calculate Hebrew date from Gregorian date (but don't show it in form)
                      if (gregorianDate) {
                        const dateObj = new Date(gregorianDate)
                        const hebrewDate = convertToHebrewDate(dateObj)
                        setMemberForm({ 
                          ...memberForm, 
                          birthDate: gregorianDate,
                          hebrewBirthDate: hebrewDate
                        })
                      } else {
                        setMemberForm({ ...memberForm, birthDate: gregorianDate })
                      }
                    }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Hebrew date will be auto-calculated in the background</p>
                </div>
                {editingMember && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Hebrew Birth Date</label>
                    <input
                      type="text"
                      value={memberForm.hebrewBirthDate}
                      onChange={(e) => setMemberForm({ ...memberForm, hebrewBirthDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Hebrew birth date"
                    />
                    <p className="text-xs text-gray-500 mt-1">Hebrew date - Used for Bar/Bat Mitzvah date (13th Hebrew birthday)</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Gender *</label>
                  <select
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                {editingMember && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Marriage Information (Auto-converts to new family)</p>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Wedding Date</label>
                        <input
                          type="date"
                          value={memberForm.weddingDate}
                          onChange={(e) => setMemberForm({ ...memberForm, weddingDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="Select wedding date"
                        />
                        <p className="text-xs text-gray-500 mt-1">When set, this child will be automatically converted to a new family on the wedding date and removed from current family</p>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Spouse Name (Optional)</label>
                        <input
                          type="text"
                          value={memberForm.spouseName}
                          onChange={(e) => setMemberForm({ ...memberForm, spouseName: e.target.value })}
                          onBlur={(e) => {
                            if (e.target.value) {
                              setMemberForm({ ...memberForm, spouseName: capitalizeName(e.target.value) })
                            }
                          }}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter spouse's full name"
                        />
                        <p className="text-xs text-gray-500 mt-1">Spouse will be added as a member of the new family</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-4 justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowMemberModal(false)
                      setEditingMember(null)
                      setMemberForm({
                        firstName: '',
                        hebrewFirstName: '',
                        lastName: '',
                        hebrewLastName: '',
                        birthDate: '',
                        hebrewBirthDate: '',
                        gender: '',
                        weddingDate: '',
                        spouseName: '',
                        spouseFirstName: '',
                        spouseHebrewName: '',
                        spouseFatherHebrewName: '',
                        spouseCellPhone: '',
                        phone: '',
                        email: '',
                        address: '',
                        city: '',
                        state: '',
                        zip: ''
                      })
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {editingMember ? 'Update Child' : 'Add Child'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInfoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Family Information</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                try {
                  const res = await fetch(`/api/kasa/families/${params.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...infoForm,
                      weddingDate: infoForm.weddingDate ? new Date(infoForm.weddingDate).toISOString() : undefined,
                      paymentPlanId: infoForm.paymentPlanId || undefined
                    })
                  })
                  if (res.ok) {
                    setShowInfoModal(false)
                    fetchFamilyDetails()
                  }
                } catch (error) {
                  console.error('Error updating family info:', error)
                }
              }} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Family Name *</label>
                      <input
                        type="text"
                        required
                        value={infoForm.name}
                        onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Family Name (Hebrew)</label>
                      <input
                        type="text"
                        dir="rtl"
                        lang="he"
                        value={infoForm.hebrewName}
                        onChange={(e) => setInfoForm({ ...infoForm, hebrewName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right"
                        style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Wedding Date *</label>
                      <input
                        type="date"
                        required
                        value={infoForm.weddingDate}
                        onChange={(e) => setInfoForm({ ...infoForm, weddingDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Payment Plan</label>
                      <select
                        value={infoForm.paymentPlanId}
                        onChange={(e) => setInfoForm({ ...infoForm, paymentPlanId: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select a plan</option>
                        {paymentPlans.map(plan => (
                          <option key={plan._id} value={plan._id}>{plan.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Husband Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Husband Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={infoForm.husbandFirstName}
                        onChange={(e) => setInfoForm({ ...infoForm, husbandFirstName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Hebrew Name</label>
                      <input
                        type="text"
                        dir="rtl"
                        lang="he"
                        value={infoForm.husbandHebrewName}
                        onChange={(e) => setInfoForm({ ...infoForm, husbandHebrewName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right"
                        style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Father's Hebrew Name</label>
                      <input
                        type="text"
                        dir="rtl"
                        lang="he"
                        value={infoForm.husbandFatherHebrewName}
                        onChange={(e) => setInfoForm({ ...infoForm, husbandFatherHebrewName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right"
                        style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Cell Phone</label>
                      <input
                        type="tel"
                        value={infoForm.husbandCellPhone}
                        onChange={(e) => setInfoForm({ ...infoForm, husbandCellPhone: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Wife Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Wife Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={infoForm.wifeFirstName}
                        onChange={(e) => setInfoForm({ ...infoForm, wifeFirstName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Hebrew Name</label>
                      <input
                        type="text"
                        dir="rtl"
                        lang="he"
                        value={infoForm.wifeHebrewName}
                        onChange={(e) => setInfoForm({ ...infoForm, wifeHebrewName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right"
                        style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Father's Hebrew Name</label>
                      <input
                        type="text"
                        dir="rtl"
                        lang="he"
                        value={infoForm.wifeFatherHebrewName}
                        onChange={(e) => setInfoForm({ ...infoForm, wifeFatherHebrewName: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right"
                        style={{ fontFamily: 'Arial Hebrew, David, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Cell Phone</label>
                      <input
                        type="tel"
                        value={infoForm.wifeCellPhone}
                        onChange={(e) => setInfoForm({ ...infoForm, wifeCellPhone: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                      <input
                        type="email"
                        value={infoForm.email}
                        onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="family@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={infoForm.phone}
                        onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">ZIP Code</label>
                      <input
                        type="text"
                        value={infoForm.zip}
                        onChange={(e) => setInfoForm({ ...infoForm, zip: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="12345"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-gray-700">Street Address</label>
                      <input
                        type="text"
                        value={infoForm.street || infoForm.address}
                        onChange={(e) => setInfoForm({ ...infoForm, street: e.target.value, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">City</label>
                      <input
                        type="text"
                        value={infoForm.city}
                        onChange={(e) => setInfoForm({ ...infoForm, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">State</label>
                      <input
                        type="text"
                        value={infoForm.state}
                        onChange={(e) => setInfoForm({ ...infoForm, state: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="NY"
                      />
                    </div>
                  </div>
                </div>

                {/* Communication Preferences */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Communication Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-xl">
                      <input
                        type="checkbox"
                        id="receiveEmails"
                        checked={infoForm.receiveEmails}
                        onChange={(e) => setInfoForm({ ...infoForm, receiveEmails: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="receiveEmails" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Receive Email Notifications
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-xl">
                      <input
                        type="checkbox"
                        id="receiveSMS"
                        checked={infoForm.receiveSMS}
                        onChange={(e) => setInfoForm({ ...infoForm, receiveSMS: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="receiveSMS" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Receive SMS Notifications
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Uncheck these options if the family prefers not to receive email or SMS notifications
                  </p>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Save Info
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <Modal title="Add Payment" onClose={() => setShowPaymentModal(false)}>
            <form onSubmit={handleAddPayment} className="space-y-4">
              {/* Payment For Selection - Only show if opened from member view, otherwise default to family */}
              {viewingMemberId && memberActiveTab === 'payments' ? (
                <>
                  {/* When viewing a member, allow selecting payment for member or family */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment For *</label>
                    <select
                      value={paymentForm.paymentFor}
                      onChange={(e) => setPaymentForm({ 
                        ...paymentForm, 
                        paymentFor: e.target.value as 'family' | 'member',
                        memberId: e.target.value === 'family' ? '' : viewingMemberId
                      })}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="member">Member (Current: {data?.members?.find((m: any) => m._id === viewingMemberId)?.firstName} {data?.members?.find((m: any) => m._id === viewingMemberId)?.lastName})</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* When on family Payments tab, payment is always for family - hide the selection */}
                  <input type="hidden" value="family" />
                </>
              )}

              {/* Member Selection - Show only if paymentFor is 'member' and not viewing a specific member */}
              {paymentForm.paymentFor === 'member' && !viewingMemberId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Select Member *</label>
                  <select
                    value={paymentForm.memberId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, memberId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required={paymentForm.paymentFor === 'member'}
                  >
                    <option value="">Select a member...</option>
                    {data?.members?.map((member: any) => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amount || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setPaymentForm({ ...paymentForm, amount: value ? parseFloat(value) : 0 })
                  }}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.year}
                  onChange={(e) => setPaymentForm({ ...paymentForm, year: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="membership">Membership</option>
                  <option value="donation">Donation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Frequency *</label>
                <select
                  value={paymentForm.paymentFrequency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentFrequency: e.target.value as 'one-time' | 'monthly' })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="one-time">One-Time Payment</option>
                  <option value="monthly">Monthly Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod || 'cash'}
                  onChange={(e) => {
                    const selectedMethod = e.target.value as 'cash' | 'credit_card' | 'check' | 'quick_pay'
                    console.log('Payment method changed to:', selectedMethod)
                    setPaymentForm({ ...paymentForm, paymentMethod: selectedMethod, useSavedCard: false })
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="check">Check</option>
                  <option value="quick_pay">Quick Pay</option>
                </select>
              </div>

              {/* Credit Card Fields */}
              {paymentForm.paymentMethod === 'credit_card' && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">Credit Card Information</h4>
                    {paymentForm.amount > 0 && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={useStripe}
                          onChange={(e) => {
                            setUseStripe(e.target.checked)
                            if (e.target.checked) {
                              setPaymentForm({ ...paymentForm, useSavedCard: false })
                            }
                          }}
                          className="rounded"
                        />
                        <span>Use Stripe (Secure Payment)</span>
                      </label>
                    )}
                  </div>

                  {/* Saved Cards */}
                  {savedPaymentMethods.length > 0 && !useStripe && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Saved Cards on File</label>
                      <div className="space-y-2">
                        {savedPaymentMethods.map((card) => (
                          <label
                            key={card._id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-100 ${
                              paymentForm.useSavedCard && paymentForm.selectedSavedCardId === card._id
                                ? 'bg-blue-200 border-blue-500'
                                : 'bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="savedCard"
                              checked={paymentForm.useSavedCard && paymentForm.selectedSavedCardId === card._id}
                              onChange={() => setPaymentForm({
                                ...paymentForm,
                                useSavedCard: true,
                                selectedSavedCardId: card._id
                              })}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{card.cardType.toUpperCase()}</span>
                                <span>•••• {card.last4}</span>
                                {card.isDefault && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Default</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Expires {card.expiryMonth}/{card.expiryYear}
                                {card.nameOnCard && ` • ${card.nameOnCard}`}
                              </div>
                            </div>
                          </label>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, useSavedCard: false, selectedSavedCardId: '' })}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Use new card instead
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!paymentForm.useSavedCard && (
                    <>
                  {useStripe ? (
                    <StripePaymentForm
                      amount={paymentForm.amount}
                      familyId={params.id as string}
                      paymentDate={paymentForm.paymentDate}
                      year={paymentForm.year}
                      type={paymentForm.type}
                      notes={paymentForm.notes}
                      saveCard={paymentForm.saveCard}
                      paymentFrequency={paymentForm.paymentFrequency}
                      memberId={paymentForm.paymentFor === 'member' && paymentForm.memberId ? paymentForm.memberId : undefined}
                      onSuccess={async (paymentIntentId) => {
                        setShowPaymentModal(false)
                        setUseStripe(false)
                        setPaymentForm({
                          amount: 0,
                          paymentDate: new Date().toISOString().split('T')[0],
                          year: new Date().getFullYear(),
                          type: 'membership',
                          paymentMethod: 'cash',
                          paymentFrequency: 'one-time',
                          paymentFor: 'family',
                          memberId: '',
                          saveCard: false,
                          useSavedCard: false,
                          selectedSavedCardId: '',
                          ccLast4: '',
                          ccCardType: '',
                          ccExpiryMonth: '',
                          ccExpiryYear: '',
                          ccNameOnCard: '',
                          checkNumber: '',
                          checkBankName: '',
                          checkRoutingNumber: '',
                          notes: ''
                        })
                        fetchFamilyDetails()
                        fetchSavedPaymentMethods()
                      }}
                      onError={(error) => {
                        alert(`Payment error: ${error}`)
                      }}
                    />
                  ) : (
                    <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Last 4 Digits *</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={paymentForm.ccLast4}
                        onChange={(e) => setPaymentForm({ ...paymentForm, ccLast4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Type</label>
                      <select
                        value={paymentForm.ccCardType}
                        onChange={(e) => setPaymentForm({ ...paymentForm, ccCardType: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Select...</option>
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="American Express">American Express</option>
                        <option value="Discover">Discover</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Month</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={paymentForm.ccExpiryMonth}
                        onChange={(e) => setPaymentForm({ ...paymentForm, ccExpiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="MM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Year</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={paymentForm.ccExpiryYear}
                        onChange={(e) => setPaymentForm({ ...paymentForm, ccExpiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="YYYY"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name on Card</label>
                    <input
                      type="text"
                      value={paymentForm.ccNameOnCard}
                      onChange={(e) => setPaymentForm({ ...paymentForm, ccNameOnCard: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="John Doe"
                    />
                  </div>
                      {paymentForm.amount > 0 && (
                        <label className="flex items-center gap-2 text-sm mt-3">
                          <input
                            type="checkbox"
                            checked={paymentForm.saveCard}
                            onChange={(e) => setPaymentForm({ ...paymentForm, saveCard: e.target.checked })}
                            className="rounded"
                          />
                          <span>Save card for future use</span>
                        </label>
                      )}
                    </>
                  )}
                    </>
                  )}
                  {paymentForm.useSavedCard && paymentForm.selectedSavedCardId && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-3">
                      <p className="text-sm text-green-800 mb-2">
                        Ready to charge saved card. Click "Add Payment" below to process.
                      </p>
                      {paymentForm.paymentFrequency === 'monthly' && (
                        <p className="text-xs text-green-700">
                          This will be set up as a monthly recurring payment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Check Fields */}
              {paymentForm.paymentMethod === 'check' && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-gray-700 mb-2">Check Information</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">Check Number *</label>
                    <input
                      type="text"
                      required
                      value={paymentForm.checkNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, checkNumber: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={paymentForm.checkBankName}
                      onChange={(e) => setPaymentForm({ ...paymentForm, checkBankName: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={paymentForm.checkRoutingNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, checkRoutingNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="9-digit routing number"
                      maxLength={9}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              {!(paymentForm.paymentMethod === 'credit_card' && useStripe) && (
                <div className="flex gap-4 justify-end">
                  <button type="button" onClick={() => {
                    setShowPaymentModal(false)
                    setUseStripe(false)
                  }} className="px-4 py-2 border rounded">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                    Add Payment
                  </button>
                </div>
              )}
            </form>
          </Modal>
        )}

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Email Configuration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Configure email settings to send statements via email.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Gmail Address *</label>
                  <input
                    type="email"
                    required
                    value={emailFormData.email}
                    onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gmail App Password *</label>
                  <input
                    type="password"
                    required
                    value={emailFormData.password}
                    onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                    placeholder="16-character app password"
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate an app password from{' '}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Google Account Settings
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From Name</label>
                  <input
                    type="text"
                    value={emailFormData.fromName}
                    onChange={(e) => setEmailFormData({ ...emailFormData, fromName: e.target.value })}
                    placeholder="Kasa Family Management"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEmailConfig}
                    className="px-4 py-2 bg-purple-600 text-white rounded"
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEventModal && (
          <Modal title="Add Lifecycle Event" onClose={() => setShowEventModal(false)}>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Type *</label>
                <select
                  value={eventForm.eventType}
                  onChange={(e) => updateEventAmount(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {lifecycleEventTypes.length === 0 ? (
                    <option value="">Loading event types...</option>
                  ) : (
                    lifecycleEventTypes.map((eventType) => (
                      <option key={eventType._id} value={eventType.type}>
                        {eventType.name} - ${eventType.amount.toLocaleString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  value={eventForm.amount}
                  onChange={(e) => setEventForm({ ...eventForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Date *</label>
                <input
                  type="date"
                  required
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year *</label>
                <input
                  type="number"
                  required
                  value={eventForm.year}
                  onChange={(e) => setEventForm({ ...eventForm, year: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Add Event
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingNote ? 'Edit Note' : 'Add Note'}
                </h2>
                <button
                  onClick={() => {
                    setShowNoteModal(false)
                    setEditingNote(null)
                    setNoteText('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Note *</label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[150px]"
                    placeholder="Enter your note here..."
                    autoFocus
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteModal(false)
                      setEditingNote(null)
                      setNoteText('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    {editingNote ? 'Update Note' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Relationship Modal */}
        {showRelationshipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Add Relationship</h2>
                <button
                  onClick={() => {
                    setShowRelationshipModal(false)
                    setRelationshipForm({
                      relatedFamilyId: '',
                      relationshipType: 'related',
                      customType: '',
                      notes: ''
                    })
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Related Family *</label>
                  <select
                    required
                    value={relationshipForm.relatedFamilyId}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, relatedFamilyId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a family</option>
                    {allFamilies.map((family) => (
                      <option key={family._id} value={family._id}>{family.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Relationship Type *</label>
                  <select
                    required
                    value={relationshipForm.relationshipType}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, relationshipType: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="related">Related</option>
                    <option value="merged">Merged</option>
                    <option value="split">Split</option>
                    <option value="parent_child">Parent/Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {relationshipForm.relationshipType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Custom Type *</label>
                    <input
                      type="text"
                      required
                      value={relationshipForm.customType}
                      onChange={(e) => setRelationshipForm({ ...relationshipForm, customType: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Cousin, In-law, etc."
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Notes</label>
                  <textarea
                    value={relationshipForm.notes}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, notes: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional notes about this relationship..."
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRelationshipModal(false)
                      setRelationshipForm({
                        relatedFamilyId: '',
                        relationshipType: 'related',
                        customType: '',
                        notes: ''
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRelationship}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Add Relationship
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

