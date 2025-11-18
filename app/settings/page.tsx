'use client'

import { useState, useEffect } from 'react'
import { EnvelopeIcon, PlusIcon, PencilIcon, TrashIcon, CalendarIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon, UserGroupIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import React from 'react'

interface LifecycleEventType {
  _id: string
  type: string
  name: string
  amount: number
}

interface Family {
  _id: string
  name: string
  weddingDate: string
}

interface PaymentPlan {
  _id: string
  name: string
  yearlyPrice: number
  familyCount?: number
  families?: Family[]
}

type TabType = 'email' | 'eventTypes' | 'paymentPlans' | 'kevittel' | 'cycle'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('email')
  
  // Email Configuration state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: '',
    fromName: 'Kasa Family Management'
  })
  
  // Debug: Log emailFormData changes
  useEffect(() => {
    console.log('📧 Email formData changed:', { email: emailFormData.email, fromName: emailFormData.fromName })
  }, [emailFormData.email, emailFormData.fromName])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Event Types state
  const [eventTypes, setEventTypes] = useState<LifecycleEventType[]>([])
  const [eventTypesLoading, setEventTypesLoading] = useState(true)
  const [showEventTypeModal, setShowEventTypeModal] = useState(false)
  const [editingEventType, setEditingEventType] = useState<LifecycleEventType | null>(null)
  const [eventTypeFormData, setEventTypeFormData] = useState({
    type: '',
    name: '',
    amount: ''
  })

  // Payment Plans state
  const [plans, setPlans] = useState<PaymentPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [planFormData, setPlanFormData] = useState({
    name: '',
    yearlyPrice: 0
  })

  // Kevittel state
  const [kevittelFamilies, setKevittelFamilies] = useState<any[]>([])
  const [kevittelLoading, setKevittelLoading] = useState(true)
  const [editingKevittel, setEditingKevittel] = useState<{ familyId: string; entryIndex: number } | null>(null)
  const [kevittelEditText, setKevittelEditText] = useState('')

  // Cycle Configuration state
  const [cycleConfig, setCycleConfig] = useState<any>(null)
  const [cycleLoading, setCycleLoading] = useState(true)
  const [cycleFormData, setCycleFormData] = useState({
    cycleStartMonth: 9, // September default
    cycleStartDay: 1,
    description: 'Membership cycle start date'
  })

  useEffect(() => {
    fetchEmailConfig()
    fetchEventTypes()
    fetchPlans()
    fetchKevittelData()
    fetchCycleConfig()
  }, [])

  // Refresh Kevittel data when switching to the Kevittel tab
  useEffect(() => {
    if (activeTab === 'kevittel' && !kevittelLoading) {
      fetchKevittelData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Email Configuration functions
  const fetchEmailConfig = async () => {
    try {
      const res = await fetch('/api/kasa/email-config')
      console.log('📧 Email config fetch - Status:', res.status, res.statusText)
      if (res.ok) {
        const config = await res.json()
        console.log('📧 Email config fetch - Found config:', config)
        setEmailConfig(config)
        setEmailFormData({
          email: config.email || '',
          password: '',
          fromName: config.fromName || 'Kasa Family Management'
        })
        console.log('📧 Email config fetch - Set formData.email to:', config.email || '(empty)')
      } else {
        // No config exists for this user - clear everything
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.log('📧 Email config fetch - No config found (404):', errorData)
        setEmailConfig(null)
        setEmailFormData({
          email: '',
          password: '',
          fromName: 'Kasa Family Management'
        })
        console.log('📧 Email config fetch - Cleared formData.email to empty string')
      }
    } catch (error) {
      console.error('Error fetching email config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!emailFormData.email) {
      setMessage({ type: 'error', text: 'Email address is required' })
      setSaving(false)
      return
    }

    if (!emailConfig && !emailFormData.password) {
      setMessage({ type: 'error', text: 'Password is required for new email configuration' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/kasa/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailFormData)
      })

      const result = await res.json()

      if (res.ok) {
        setEmailConfig(result)
        setEmailFormData(prev => ({ ...prev, password: '' }))
        setMessage({ 
          type: 'success', 
          text: emailConfig 
            ? 'Email configuration updated successfully!' 
            : 'Email configuration saved successfully!' 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save email configuration' })
      }
    } catch (error: any) {
      console.error('Error saving email config:', error)
      setMessage({ type: 'error', text: 'Error saving email configuration' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!emailConfig?.email) {
      setMessage({ type: 'error', text: 'Please save email configuration first' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/kasa/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send test email' })
      }
    } catch (error: any) {
      console.error('Error sending test email:', error)
      setMessage({ type: 'error', text: 'Error sending test email' })
    } finally {
      setSaving(false)
    }
  }

  // Cycle Configuration functions
  const fetchCycleConfig = async () => {
    try {
      setCycleLoading(true)
      const res = await fetch('/api/kasa/cycle-config')
      if (res.ok) {
        const config = await res.json()
        setCycleConfig(config)
        setCycleFormData({
          cycleStartMonth: config.cycleStartMonth || 9,
          cycleStartDay: config.cycleStartDay || 1,
          description: config.description || 'Membership cycle start date'
        })
      } else {
        // No config exists for this user - clear everything
        setCycleConfig(null)
        setCycleFormData({
          cycleStartMonth: 9, // Default form values (not saved)
          cycleStartDay: 1,
          description: 'Membership cycle start date'
        })
      }
    } catch (error) {
      console.error('Error fetching cycle config:', error)
      setCycleConfig(null)
    } finally {
      setCycleLoading(false)
    }
  }

  const handleSaveCycleConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/kasa/cycle-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycleFormData)
      })

      const result = await res.json()

      if (res.ok) {
        setCycleConfig(result)
        setMessage({ 
          type: 'success', 
          text: cycleConfig 
            ? 'Cycle configuration updated successfully!' 
            : 'Cycle configuration saved successfully!' 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save cycle configuration' })
      }
    } catch (error: any) {
      console.error('Error saving cycle config:', error)
      setMessage({ type: 'error', text: 'Error saving cycle configuration' })
    } finally {
      setSaving(false)
    }
  }

  // Event Types functions
  const fetchEventTypes = async () => {
    try {
      const res = await fetch('/api/kasa/lifecycle-event-types')
      const data = await res.json()
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
        setEventTypes(sorted)
      } else {
        setEventTypes([])
      }
    } catch (error) {
      console.error('Error fetching event types:', error)
      setEventTypes([])
    } finally {
      setEventTypesLoading(false)
    }
  }

  const initializeEventTypeDefaults = async () => {
    if (!confirm('This will create default event types if they don\'t exist. Continue?')) {
      return
    }

    try {
      const res = await fetch('/api/kasa/lifecycle-event-types/initialize', {
        method: 'POST'
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Default event types initialized successfully!' })
        fetchEventTypes()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to initialize defaults' })
      }
    } catch (error) {
      console.error('Error initializing defaults:', error)
      setMessage({ type: 'error', text: 'Failed to initialize default event types' })
    }
  }

  const resetEventTypeForm = () => {
    setEventTypeFormData({
      type: '',
      name: '',
      amount: ''
    })
    setEditingEventType(null)
  }

  const handleEditEventType = (eventType: LifecycleEventType) => {
    setEditingEventType(eventType)
    setEventTypeFormData({
      type: eventType.type,
      name: eventType.name,
      amount: eventType.amount.toString()
    })
    setShowEventTypeModal(true)
  }

  const handleDeleteEventType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event type?')) {
      return
    }

    try {
      const res = await fetch(`/api/kasa/lifecycle-event-types/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Event type deleted successfully!' })
        fetchEventTypes()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete event type' })
      }
    } catch (error) {
      console.error('Error deleting event type:', error)
      setMessage({ type: 'error', text: 'Failed to delete event type' })
    }
  }

  const handleSubmitEventType = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingEventType
        ? `/api/kasa/lifecycle-event-types/${editingEventType._id}`
        : '/api/kasa/lifecycle-event-types'
      
      const method = editingEventType ? 'PUT' : 'POST'
      
      const body = editingEventType
        ? { name: eventTypeFormData.name, amount: eventTypeFormData.amount }
        : { type: eventTypeFormData.type, name: eventTypeFormData.name, amount: eventTypeFormData.amount }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowEventTypeModal(false)
        resetEventTypeForm()
        setMessage({ 
          type: 'success', 
          text: editingEventType ? 'Event type updated successfully!' : 'Event type created successfully!' 
        })
        fetchEventTypes()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save event type' })
      }
    } catch (error) {
      console.error('Error saving event type:', error)
      setMessage({ type: 'error', text: 'Failed to save event type' })
    }
  }

  // Payment Plans functions
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/kasa/payment-plans')
      const data = await res.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching payment plans:', error)
    } finally {
      setPlansLoading(false)
    }
  }

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPlan 
        ? `/api/kasa/payment-plans/${editingPlan._id}`
        : '/api/kasa/payment-plans'
      
      const method = editingPlan ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planFormData)
      })

      if (res.ok) {
        setShowPlanModal(false)
        setEditingPlan(null)
        resetPlanForm()
        fetchPlans()
        setMessage({ type: 'success', text: editingPlan ? 'Payment plan updated successfully!' : 'Payment plan created successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save payment plan' })
      }
    } catch (error) {
      console.error('Error saving payment plan:', error)
      setMessage({ type: 'error', text: 'Failed to save payment plan' })
    }
  }

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan)
    setPlanFormData({
      name: plan.name,
      yearlyPrice: plan.yearlyPrice
    })
    setShowPlanModal(true)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment plan?')) return
    
    try {
      const res = await fetch(`/api/kasa/payment-plans/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPlans()
        setMessage({ type: 'success', text: 'Payment plan deleted successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete payment plan' })
      }
    } catch (error) {
      console.error('Error deleting payment plan:', error)
      setMessage({ type: 'error', text: 'Failed to delete payment plan' })
    }
  }

  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      yearlyPrice: 0
    })
  }

  const toggleExpandPlan = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId)
  }

  // Kevittel edit functions
  const handleEditKevittel = (familyId: string, entryIndex: number, currentText: string) => {
    setEditingKevittel({ familyId, entryIndex })
    setKevittelEditText(currentText)
  }

  const handleSaveKevittel = async (familyId: string, entryIndex: number) => {
    try {
      const family = kevittelFamilies.find(f => f._id === familyId)
      if (!family) return

      // Parse the edited text to update the appropriate field
      const editedText = kevittelEditText.trim()
      
      // Determine which field to update based on entryIndex
      // 0 = husband, 1 = wife, 2+ = children
      const entries: string[] = []
      if (family.husbandHebrewName && family.husbandHebrewName.trim() !== '') {
        let husbandEntry = family.husbandHebrewName
        if (family.husbandFatherHebrewName && family.husbandFatherHebrewName.trim() !== '') {
          husbandEntry += ` בן ${family.husbandFatherHebrewName}`
        }
        entries.push(husbandEntry)
      }
      if (family.wifeHebrewName && family.wifeHebrewName.trim() !== '') {
        let wifeEntry = `וזו' ${family.wifeHebrewName}`
        if (family.wifeFatherHebrewName && family.wifeFatherHebrewName.trim() !== '') {
          wifeEntry += ` בת ${family.wifeFatherHebrewName}`
        }
        entries.push(wifeEntry)
      }
      const children = family.members || []
      children.forEach((child: any) => {
        const childHebrewName = child.hebrewFirstName || ''
        if (childHebrewName && childHebrewName.trim() !== '') {
          entries.push(`ב' ${childHebrewName}`)
        }
      })

      if (entryIndex === 0 && entries.length > 0) {
        // Editing husband entry
        const parts = editedText.split(' בן ')
        const husbandName = parts[0].trim()
        const fatherName = parts.length > 1 ? parts[1].trim() : ''
        
        const updateData: any = { husbandHebrewName: husbandName }
        if (fatherName) {
          updateData.husbandFatherHebrewName = fatherName
        }
        
        const res = await fetch(`/api/kasa/families/${familyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        
        if (res.ok) {
          await fetchKevittelData()
        }
      } else if (entryIndex === 1 && entries.length > 1) {
        // Editing wife entry
        const wifeText = editedText.replace(/^וזו'?\s*/, '').trim()
        const parts = wifeText.split(' בת ')
        const wifeName = parts[0].trim()
        const fatherName = parts.length > 1 ? parts[1].trim() : ''
        
        const updateData: any = { wifeHebrewName: wifeName }
        if (fatherName) {
          updateData.wifeFatherHebrewName = fatherName
        }
        
        const res = await fetch(`/api/kasa/families/${familyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        
        if (res.ok) {
          await fetchKevittelData()
        }
      } else if (entryIndex >= 2) {
        // Editing child entry
        const childText = editedText.replace(/^ב'?\s*/, '').trim()
        const childIndex = entryIndex - 2
        const children = family.members || []
        if (children[childIndex]) {
          const res = await fetch(`/api/kasa/families/${familyId}/members/${children[childIndex]._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hebrewFirstName: childText })
          })
          
          if (res.ok) {
            await fetchKevittelData()
          }
        }
      }
      
      setEditingKevittel(null)
      setKevittelEditText('')
    } catch (error) {
      console.error('Error saving kevittel:', error)
      alert('Error saving kevittel entry')
    }
  }

  const handleCancelEditKevittel = () => {
    setEditingKevittel(null)
    setKevittelEditText('')
  }

  // Kevittel functions
  const fetchKevittelData = async () => {
    try {
      // Fetch all families
      const familiesRes = await fetch('/api/kasa/families')
      if (!familiesRes.ok) {
        console.error('Failed to fetch families:', familiesRes.status)
        setKevittelFamilies([])
        setKevittelLoading(false)
        return
      }
      
      const families = await familiesRes.json()
      console.log('Fetched families:', families.length)
      
      // Log Hebrew names from fetched families
      families.forEach((family: any, index: number) => {
        console.log(`Family ${index + 1} (${family.name}):`, {
          hebrewName: family.hebrewName || '(empty)',
          husbandHebrewName: family.husbandHebrewName || '(empty)',
          husbandFatherHebrewName: family.husbandFatherHebrewName || '(empty)',
          wifeHebrewName: family.wifeHebrewName || '(empty)',
          wifeFatherHebrewName: family.wifeFatherHebrewName || '(empty)'
        })
      })
      
      // Fetch members for each family and sort by age
      const familiesWithMembers = await Promise.all(
        families.map(async (family: any) => {
          try {
            const membersRes = await fetch(`/api/kasa/families/${family._id}/members`)
            if (!membersRes.ok) {
              console.error(`Failed to fetch members for family ${family._id}:`, membersRes.status)
              return { ...family, members: [] }
            }
            
            const members = await membersRes.json()
            
            // Debug: Log members for this family
            console.log(`Family "${family.name}" members:`, members.map((m: any) => ({
              name: `${m.firstName} ${m.lastName}`,
              hebrewFirstName: m.hebrewFirstName || '(empty)',
              hebrewLastName: m.hebrewLastName || '(empty)'
            })))
            
            // Sort children by birthDate (oldest first)
            const sortedChildren = members
              .filter((member: any) => member.birthDate)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.birthDate).getTime()
                const dateB = new Date(b.birthDate).getTime()
                return dateA - dateB // Oldest first
              })
            
            return {
              ...family,
              members: sortedChildren
            }
          } catch (error) {
            console.error(`Error fetching members for family ${family._id}:`, error)
            return { ...family, members: [] }
          }
        })
      )
      
      console.log('Families with members:', familiesWithMembers.length)
      console.log('Sample family:', familiesWithMembers[0])
      
      // Log which families have Hebrew names
      const familiesWithHebrewNames = familiesWithMembers.filter((family: any) => {
        const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
        const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
        const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
        return hasHusbandName || hasWifeName || hasChildren
      })
      console.log(`Families with Hebrew names: ${familiesWithHebrewNames.length} out of ${familiesWithMembers.length}`)
      
      setKevittelFamilies(familiesWithMembers)
    } catch (error) {
      console.error('Error fetching kevittel data:', error)
      setKevittelFamilies([])
    } finally {
      setKevittelLoading(false)
    }
  }

  if (loading || eventTypesLoading || plansLoading || kevittelLoading || cycleLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600">Manage your system configuration</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'email'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5" />
                  Email Configuration
                </div>
              </button>
              <button
                onClick={() => setActiveTab('eventTypes')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'eventTypes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Event Types
                </div>
              </button>
              <button
                onClick={() => setActiveTab('paymentPlans')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'paymentPlans'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Payment Plans
                </div>
              </button>
              <button
                onClick={() => setActiveTab('kevittel')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'kevittel'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Kevittel
                </div>
              </button>
              <button
                onClick={() => setActiveTab('cycle')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'cycle'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Cycle
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Email Configuration Tab */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Email Configuration</h2>
                <p className="text-sm text-gray-600">Configure Gmail settings for sending statements</p>
              </div>
            </div>

            {emailConfig ? (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ Email configuration is active:</strong> {emailConfig.email}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your email settings are saved and will be used automatically for sending statements.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠ No email configuration found.</strong> Please set up your email configuration below.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Each user must configure their own email settings. This configuration is separate from other users.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveEmailConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Gmail Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailFormData.email || ''}
                  onChange={(e) => {
                    console.log('📧 Email input onChange - New value:', e.target.value, 'State was:', emailFormData.email)
                    // If no config exists and value appears, it's likely autofill
                    if (!emailConfig && e.target.value && e.target.value !== emailFormData.email) {
                      console.log('📧 AUTOFILL DETECTED in onChange! Clearing...')
                      // Clear it immediately
                      setTimeout(() => {
                        e.target.value = ''
                        setEmailFormData({ ...emailFormData, email: '' })
                      }, 0)
                    } else {
                      setEmailFormData({ ...emailFormData, email: e.target.value })
                    }
                  }}
                  onFocus={(e) => {
                    console.log('📧 Email input onFocus - Current value:', e.target.value, 'State value:', emailFormData.email)
                    console.log('📧 Email input onFocus - Are they different?', e.target.value !== emailFormData.email ? 'YES - AUTOFILL DETECTED!' : 'No - values match')
                    // If browser autofilled, clear it
                    if (e.target.value !== emailFormData.email && !emailConfig) {
                      console.log('📧 Clearing autofilled value on focus')
                      e.target.value = ''
                      setEmailFormData({ ...emailFormData, email: '' })
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement
                    if (!emailConfig && target.value && target.value !== emailFormData.email) {
                      console.log('📧 AUTOFILL DETECTED in onInput! Value:', target.value)
                    }
                  }}
                  placeholder="your-email@gmail.com"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gmail account to send statements from
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Gmail App Password {emailConfig ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  required={!emailConfig}
                  value={emailFormData.password}
                  onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                  placeholder={emailConfig ? "Leave empty to keep current password" : "16-character app password"}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate an app password from{' '}
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Google Account Settings
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  From Name
                </label>
                <input
                  type="text"
                  value={emailFormData.fromName}
                  onChange={(e) => setEmailFormData({ ...emailFormData, fromName: e.target.value })}
                  placeholder="Kasa Family Management"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display name shown in sent emails
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  {saving ? 'Saving...' : emailConfig ? 'Update Configuration' : 'Save Configuration'}
                </button>
                
                {emailConfig && (
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    Send Test Email
                  </button>
                )}
              </div>
            </form>

            {emailConfig && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Email configuration is stored securely in the database</li>
                  <li>Saved settings are used automatically for all statement emails</li>
                  <li>Monthly statements are sent automatically on the 1st of each month</li>
                  <li>You can send individual statements from the Statements page or Family detail page</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Event Types Tab */}
        {activeTab === 'eventTypes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Lifecycle Event Types</h2>
                  <p className="text-sm text-gray-600">Manage event types and their default amounts</p>
                </div>
              </div>
              <div className="flex gap-3">
                {eventTypes.length === 0 && (
                  <button
                    onClick={initializeEventTypeDefaults}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    Initialize Defaults
                  </button>
                )}
                <button
                  onClick={() => {
                    resetEventTypeForm()
                    setShowEventTypeModal(true)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Event Type
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventTypes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        No event types found. Click "Initialize Defaults" to create default event types (Bar Mitzvah, Chasena/Wedding, Birth Boy, Birth Girl) or "Add Event Type" to create a custom one.
                      </td>
                    </tr>
                  ) : (
                    eventTypes.map((eventType) => (
                      <tr key={eventType._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {eventType.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ${eventType.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEventType(eventType)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit Event Type"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEventType(eventType._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Event Type"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {eventTypes.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        Total ({eventTypes.length} event types):
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        ${eventTypes.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Payment Plans Tab */}
        {activeTab === 'paymentPlans' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Payment Plans</h2>
                  <p className="text-sm text-gray-600">Manage payment plans and view families using each plan</p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetPlanForm()
                  setEditingPlan(null)
                  setShowPlanModal(true)
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5" />
                Add Payment Plan
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yearly Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Families
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => {
                    const isExpanded = expandedPlan === plan._id
                    return (
                      <React.Fragment key={plan._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{plan.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold">
                            ${plan.yearlyPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            ${(plan.yearlyPrice / 12).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleExpandPlan(plan._id)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <UserGroupIcon className="h-5 w-5" />
                              <span className="font-medium">{plan.familyCount || 0} families</span>
                              {isExpanded ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit Plan"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Plan"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && plan.families && plan.families.length > 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="ml-8">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Families using this plan:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {plan.families.map((family) => (
                                    <Link
                                      key={family._id}
                                      href={`/families/${family._id}`}
                                      className="block p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                      <div className="font-medium text-gray-800">{family.name}</div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        Wedding: {new Date(family.weddingDate).toLocaleDateString()}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {isExpanded && (!plan.families || plan.families.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="ml-8 text-gray-500 text-sm">No families are currently using this plan.</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Event Type Modal */}
        {showEventTypeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">
                {editingEventType ? 'Edit' : 'Add'} Event Type
              </h2>
              <form onSubmit={handleSubmitEventType} className="space-y-4">
                {!editingEventType && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type Code *</label>
                    <input
                      type="text"
                      value={eventTypeFormData.type}
                      onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., chasena, bar_mitzvah"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique identifier (lowercase, use underscores)
                    </p>
                  </div>
                )}
                {editingEventType && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type Code</label>
                    <input
                      type="text"
                      value={eventTypeFormData.type}
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Type code cannot be changed after creation
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={eventTypeFormData.name}
                    onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Chasena, Bar Mitzvah"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={eventTypeFormData.amount}
                    onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, amount: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingEventType ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventTypeModal(false)
                      resetEventTypeForm()
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kevittel Tab */}
        {activeTab === 'kevittel' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-end mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      const familiesWithKevittel = kevittelFamilies
                        .filter((family) => {
                          const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
                          const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
                          const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
                          return hasHusbandName || hasWifeName || hasChildren
                        })
                        .map((family) => {
                          const husbandHebrewName = family.husbandHebrewName || ''
                          const husbandFatherHebrewName = family.husbandFatherHebrewName || ''
                          const wifeHebrewName = family.wifeHebrewName || ''
                          const wifeFatherHebrewName = family.wifeFatherHebrewName || ''
                          const children = family.members || []
                          
                          const entries: string[] = []
                          
                          // Husband: name + בן + father's name
                          if (husbandHebrewName && husbandHebrewName.trim() !== '') {
                            let husbandEntry = husbandHebrewName
                            if (husbandFatherHebrewName && husbandFatherHebrewName.trim() !== '') {
                              husbandEntry += ` בן ${husbandFatherHebrewName}`
                            }
                            entries.push(husbandEntry)
                          }
                          
                          // Wife: name + בת + father's name
                          if (wifeHebrewName && wifeHebrewName.trim() !== '') {
                            let wifeEntry = wifeHebrewName
                            if (wifeFatherHebrewName && wifeFatherHebrewName.trim() !== '') {
                              wifeEntry += ` בת ${wifeFatherHebrewName}`
                            }
                            entries.push(wifeEntry)
                          }
                          
                          // Children with "ב" prefix
                          children.forEach((child: any) => {
                            const childHebrewName = child.hebrewFirstName || ''
                            if (childHebrewName && childHebrewName.trim() !== '') {
                              entries.push(`ב' ${childHebrewName}`)
                            }
                          })
                          
                          return entries.join('<br>') // Join with <br> for HTML
                        })
                        .filter(text => text.trim() !== '')
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Kevittel</title>
                            <style>
                              @media print {
                                @page { margin: 2cm; }
                                body { margin: 0; }
                              }
                              body {
                                font-family: Arial Hebrew, David, sans-serif;
                                direction: rtl;
                                text-align: right;
                                padding: 40px;
                                line-height: 2;
                                font-size: 18px;
                              }
                              .kevittel-item {
                                margin-bottom: 20px;
                                padding: 10px 0;
                                border-bottom: 1px solid #eee;
                              }
                              .kevittel-item:last-child {
                                border-bottom: none;
                              }
                            </style>
                          </head>
                          <body>
                            ${familiesWithKevittel.map(text => `<div class="kevittel-item">${text}</div>`).join('')}
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Dynamically import html2pdf only in the browser
                      const html2pdf = (await import('html2pdf.js')).default
                      
                      if (kevittelFamilies.length === 0) {
                        alert('No kevittel data available. Please add Hebrew names to families.')
                        return
                      }
                      
                      const familiesWithKevittel = kevittelFamilies
                        .filter((family) => {
                          const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
                          const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
                          const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
                          return hasHusbandName || hasWifeName || hasChildren
                        })
                        .map((family) => {
                          const husbandHebrewName = family.husbandHebrewName || ''
                          const husbandFatherHebrewName = family.husbandFatherHebrewName || ''
                          const wifeHebrewName = family.wifeHebrewName || ''
                          const wifeFatherHebrewName = family.wifeFatherHebrewName || ''
                          const children = family.members || []
                          
                          const entries: string[] = []
                          
                          // Husband: name + בן + father's name
                          if (husbandHebrewName && husbandHebrewName.trim() !== '') {
                            let husbandEntry = husbandHebrewName
                            if (husbandFatherHebrewName && husbandFatherHebrewName.trim() !== '') {
                              husbandEntry += ` בן ${husbandFatherHebrewName}`
                            }
                            entries.push(husbandEntry)
                          }
                          
                          // Wife: name + בת + father's name
                          if (wifeHebrewName && wifeHebrewName.trim() !== '') {
                            let wifeEntry = wifeHebrewName
                            if (wifeFatherHebrewName && wifeFatherHebrewName.trim() !== '') {
                              wifeEntry += ` בת ${wifeFatherHebrewName}`
                            }
                            entries.push(wifeEntry)
                          }
                          
                          // Children with "ב" prefix
                          children.forEach((child: any) => {
                            const childHebrewName = child.hebrewFirstName || ''
                            if (childHebrewName && childHebrewName.trim() !== '') {
                              entries.push(`ב' ${childHebrewName}`)
                            }
                          })
                          
                          return entries.length > 0 ? { entries, familyName: family.name } : null
                        })
                        .filter((item): item is { entries: string[]; familyName: string } => item !== null)
                      
                      if (familiesWithKevittel.length === 0) {
                        alert('No kevittel data to export. Please add Hebrew names to families.')
                        return
                      }
                      
                      // Create a new window with the content for PDF generation
                      const printWindow = window.open('', '_blank')
                      if (!printWindow) {
                        alert('Please allow popups to generate PDF')
                        return
                      }
                      
                      const currentDate = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
                      
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html dir="rtl" lang="he">
                          <head>
                            <meta charset="UTF-8">
                            <title>Kevittel</title>
                            <style>
                              @media print {
                                @page { margin: 2cm; }
                                body { margin: 0; }
                              }
                              * {
                                direction: rtl;
                                text-align: right;
                              }
                              body {
                                font-family: Arial Hebrew, David, sans-serif;
                                direction: rtl;
                                text-align: right;
                                padding: 40px;
                                line-height: 2;
                                font-size: 18px;
                                background: white;
                              }
                              .kevittel-family {
                                margin-bottom: 30px;
                                padding-bottom: 20px;
                                border-bottom: 2px solid #ddd;
                                page-break-inside: avoid;
                              }
                              .kevittel-family:last-child {
                                border-bottom: none;
                              }
                              .kevittel-entry {
                                margin-bottom: 10px;
                                padding: 5px 0;
                                font-size: 18px;
                                line-height: 2;
                              }
                              .footer {
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                text-align: center;
                                direction: rtl;
                                font-size: 14px;
                                color: #666;
                              }
                            </style>
                          </head>
                          <body>
                            ${familiesWithKevittel.map(family => `
                              <div class="kevittel-family">
                                ${family.entries.map(entry => `<div class="kevittel-entry">${entry}</div>`).join('')}
                              </div>
                            `).join('')}
                            <div class="footer">
                              <p>נוצר ב-${currentDate}</p>
                              <p>מערכת ניהול משפחות קאסא</p>
                            </div>
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      
                      // Wait for content to load
                      await new Promise(resolve => setTimeout(resolve, 500))
                      
                      // Generate PDF from the new window's content
                      const contentElement = printWindow.document.body
                      
                      const opt = {
                        margin: [20, 20, 20, 20] as [number, number, number, number],
                        filename: `Kevittel_${new Date().toISOString().split('T')[0]}.pdf`,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: { 
                          scale: 2,
                          useCORS: true,
                          logging: false,
                          windowWidth: printWindow.innerWidth,
                          windowHeight: printWindow.innerHeight
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
                      }
                      
                      await html2pdf().set(opt).from(contentElement).save()
                      
                      // Close the print window
                      printWindow.close()
                    } catch (error) {
                      console.error('Error generating PDF:', error)
                      alert('Error generating PDF. Please try again.')
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Save as PDF
                </button>
              </div>
            </div>

            <div id="kevittel-content" className="space-y-4 print:space-y-2">
              {kevittelLoading ? (
                <div className="text-center py-12 text-gray-500">
                  Loading families...
                </div>
              ) : (() => {
                // Debug: Log what we have
                console.log('Kevittel families count:', kevittelFamilies.length)
                console.log('Kevittel families data:', kevittelFamilies)
                
                const familiesWithHebrewNames = kevittelFamilies.filter((family) => {
                  // Only show families that have at least one Hebrew name
                  const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
                  const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
                  const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
                  const hasAnyHebrewName = hasHusbandName || hasWifeName || hasChildren
                  
                  // Debug each family
                  if (!hasAnyHebrewName) {
                    console.log(`Family "${family.name}" filtered out:`, {
                      hasHusbandName,
                      hasWifeName,
                      hasChildren,
                      husbandHebrewName: family.husbandHebrewName,
                      wifeHebrewName: family.wifeHebrewName,
                      membersCount: (family.members || []).length
                    })
                  }
                  
                  return hasAnyHebrewName
                })
                
                console.log(`Filtered: ${familiesWithHebrewNames.length} families with Hebrew names out of ${kevittelFamilies.length} total`)
                
                if (kevittelFamilies.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      No families found.
                    </div>
                  )
                }
                
                if (familiesWithHebrewNames.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">
                        No families with Hebrew names found.
                      </p>
                      <p className="text-sm text-gray-400">
                        Please add Hebrew names to families in the Families section.
                      </p>
                      <p className="text-xs text-gray-300 mt-2">
                        Debug: Found {kevittelFamilies.length} families total. Check console for details.
                      </p>
                    </div>
                  )
                }
                
                return (
                  <>
                    {familiesWithHebrewNames.map((family) => {
                      const husbandHebrewName = family.husbandHebrewName || ''
                      const husbandFatherHebrewName = family.husbandFatherHebrewName || ''
                      const wifeHebrewName = family.wifeHebrewName || ''
                      const wifeFatherHebrewName = family.wifeFatherHebrewName || ''
                      const children = family.members || []
                      
                      // Build separate entries for each person (each on its own row)
                      const entries: string[] = []
                      
                      // Husband: name + בן + father's name
                      if (husbandHebrewName && husbandHebrewName.trim() !== '') {
                        let husbandEntry = husbandHebrewName
                        if (husbandFatherHebrewName && husbandFatherHebrewName.trim() !== '') {
                          husbandEntry += ` בן ${husbandFatherHebrewName}`
                        }
                        entries.push(husbandEntry)
                      }
                      
                      // Wife: זו' + name + בת + father's name
                      if (wifeHebrewName && wifeHebrewName.trim() !== '') {
                        let wifeEntry = `וזו' ${wifeHebrewName}`
                        if (wifeFatherHebrewName && wifeFatherHebrewName.trim() !== '') {
                          wifeEntry += ` בת ${wifeFatherHebrewName}`
                        }
                        entries.push(wifeEntry)
                      }
                      
                      // Add children with "ב" prefix, sorted by age (oldest first)
                      children.forEach((child: any) => {
                        const childHebrewName = child.hebrewFirstName || ''
                        if (childHebrewName && childHebrewName.trim() !== '') {
                          entries.push(`ב' ${childHebrewName}`)
                        }
                      })
                      
                      if (entries.length === 0) {
                        return null
                      }
                      
                      return (
                        <div 
                          key={family._id} 
                          className="border-b border-gray-200 py-3 print:py-2 print:border-gray-300"
                        >
                          {entries.map((entry, index) => {
                            const isEditing = editingKevittel?.familyId === family._id && editingKevittel?.entryIndex === index
                            
                            return (
                              <div 
                                key={index}
                                className="flex items-center gap-2 mb-2 last:mb-0 group"
                                dir="rtl"
                                lang="he"
                              >
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={kevittelEditText}
                                      onChange={(e) => setKevittelEditText(e.target.value)}
                                      className="flex-1 text-xl font-semibold text-gray-900 border border-blue-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      dir="rtl"
                                      lang="he"
                                      style={{ fontFamily: 'Arial Hebrew, David, sans-serif', textAlign: 'right', lineHeight: '1.8' }}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveKevittel(family._id, index)
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditKevittel()
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveKevittel(family._id, index)}
                                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditKevittel}
                                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div
                                      className="flex-1 text-xl font-semibold text-gray-900 print:text-lg print:font-normal"
                                      dir="rtl"
                                      lang="he"
                                      style={{ fontFamily: 'Arial Hebrew, David, sans-serif', textAlign: 'right', lineHeight: '1.8' }}
                                    >
                                      {entry}
                                    </div>
                                    <button
                                      onClick={() => handleEditKevittel(family._id, index, entry)}
                                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all text-sm"
                                      title="Edit"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }).filter(Boolean)}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Payment Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">
                {editingPlan ? 'Edit' : 'Add'} Payment Plan
              </h2>
              <form onSubmit={handleSubmitPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="e.g., Plan 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Yearly Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={planFormData.yearlyPrice}
                    onChange={(e) => setPlanFormData({ ...planFormData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanModal(false)
                      setEditingPlan(null)
                      resetPlanForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {editingPlan ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cycle Configuration Tab */}
        {activeTab === 'cycle' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Cycle Configuration</h2>
              <p className="text-sm text-gray-600">Configure the membership year start date</p>
            </div>

            {cycleConfig ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>✓ Cycle configuration is active:</strong> Membership year starts on{' '}
                  {new Date(2024, cycleConfig.cycleStartMonth - 1, cycleConfig.cycleStartDay).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Balances will be increased annually based on this date.
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <strong>⚠ No cycle configuration found.</strong> Please set up your cycle configuration below.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Each user must configure their own cycle settings. This configuration is separate from other users.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveCycleConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Cycle Start Month *
                </label>
                <select
                  value={cycleFormData.cycleStartMonth}
                  onChange={(e) => setCycleFormData({ ...cycleFormData, cycleStartMonth: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The month when the membership year begins
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Cycle Start Day *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={cycleFormData.cycleStartDay}
                  onChange={(e) => setCycleFormData({ ...cycleFormData, cycleStartDay: parseInt(e.target.value) || 1 })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The day of the month when the membership year begins (1-31)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={cycleFormData.description}
                  onChange={(e) => setCycleFormData({ ...cycleFormData, description: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Membership cycle start date"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional description for this cycle configuration
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> When the cycle start date arrives each year, 
                    family balances will be increased based on their payment plans. This ensures 
                    that membership fees are properly tracked and calculated annually.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : cycleConfig ? 'Update Configuration' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
