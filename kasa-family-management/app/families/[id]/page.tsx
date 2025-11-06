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
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { calculateHebrewAge, convertToHebrewDate } from '@/lib/hebrew-date'
import StripePaymentForm from '@/app/components/StripePaymentForm'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'payments' | 'events' | 'contacts' | 'statements'>('overview')
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    address: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    zip: ''
  })
  
  // Check URL params for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'members') {
      setActiveTab('members')
      // Auto-open modal if coming from quick add
      if (urlParams.get('add') === 'true') {
        // Will be handled after data loads
      }
    }
  }, [])
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
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
    spouseName: ''
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    type: 'membership' as 'membership' | 'donation' | 'other',
    paymentMethod: 'cash' as 'cash' | 'credit_card' | 'check' | 'quick_pay',
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
  const [eventForm, setEventForm] = useState({
    eventType: 'chasena' as 'chasena' | 'bar_mitzvah' | 'birth_boy' | 'birth_girl',
    amount: 12180,
    eventDate: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    notes: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchFamilyDetails()
      fetchStatements()
    }
    fetchPaymentPlans()
    fetchLifecycleEventTypes()
    fetchEmailConfig()
  }, [params.id])

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
    await handlePrintStatement(statement)
    // Browser's print dialog allows saving as PDF
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
      setContactForm({
        address: data.family.address || '',
        phone: data.family.phone || '',
        email: data.family.email || '',
        city: data.family.city || '',
        state: data.family.state || '',
        zip: data.family.zip || ''
      })
      
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
          spouseName: ''
        })
        setEditingMember(null)
        setShowMemberModal(true)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname + '?tab=members')
      }
    }
  }, [data])

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
    try {
      const res = await fetch('/api/kasa/families/' + params.id + '/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...memberForm, familyId: params.id })
      })
      if (res.ok) {
        setShowMemberModal(false)
        setEditingMember(null)
        setMemberForm({ firstName: '', hebrewFirstName: '', lastName: '', hebrewLastName: '', birthDate: '', hebrewBirthDate: '', gender: '' })
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
      spouseName: member.spouseName || ''
    })
    setShowMemberModal(true)
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    
    try {
      const res = await fetch(`/api/kasa/families/${params.id}/members/${editingMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: memberForm.firstName,
          hebrewFirstName: memberForm.hebrewFirstName,
          lastName: memberForm.lastName,
          hebrewLastName: memberForm.hebrewLastName,
          birthDate: memberForm.birthDate,
          hebrewBirthDate: memberForm.hebrewBirthDate,
          gender: memberForm.gender,
          weddingDate: memberForm.weddingDate || undefined,
          spouseName: memberForm.spouseName || undefined
        })
      })
      if (res.ok) {
        setShowMemberModal(false)
        setEditingMember(null)
        setMemberForm({ firstName: '', hebrewFirstName: '', lastName: '', hebrewLastName: '', birthDate: '', hebrewBirthDate: '', gender: '', weddingDate: '', spouseName: '' })
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
    
    // Validate amount
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }
    
    // Debug: Log form state
    console.log('Form state before submission:', paymentForm)
    console.log('Payment method from form:', paymentForm.paymentMethod)
    
    try {
      // Build payment data based on payment method
      // Ensure paymentMethod is explicitly set and never falls back to cash unless truly missing
      const selectedPaymentMethod = paymentForm.paymentMethod && paymentForm.paymentMethod !== '' 
        ? paymentForm.paymentMethod 
        : 'cash'
      
      const paymentData: any = {
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        year: paymentForm.year,
        type: paymentForm.type,
        paymentMethod: selectedPaymentMethod,
        notes: paymentForm.notes || undefined
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
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-800">{data.family.name}</h1>
              {data.family.email && (
                <p className="text-gray-600 flex items-center gap-2">
                  {data.family.email}
                </p>
              )}
              {data.family.phone && (
                <p className="text-gray-600 flex items-center gap-2">
                  {data.family.phone}
                </p>
              )}
              {(data.family.address || data.family.city) && (
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  {[data.family.address, data.family.city, data.family.state, data.family.zip].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:shadow-lg transition-all"
            >
              Edit Contacts
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'members', label: 'Members' },
                { id: 'payments', label: 'Payments' },
                { id: 'events', label: 'Lifecycle Events' },
                { id: 'statements', label: 'Statements' },
                { id: 'contacts', label: 'Contacts' }
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
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Opening Balance</p>
                      <p className="text-xl font-bold">${data.balance.openingBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Total Payments</p>
                      <p className="text-xl font-bold text-green-600">${data.balance.totalPayments.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Total Withdrawals</p>
                      <p className="text-xl font-bold text-red-600">${data.balance.totalWithdrawals.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Lifecycle Events</p>
                      <p className="text-xl font-bold text-blue-600">${data.balance.totalLifecyclePayments.toLocaleString()}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Plan Cost (Annual)</p>
                      <p className="text-xl font-bold text-orange-600">-${(data.balance.planCost || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold">${data.balance.balance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
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
                        spouseName: ''
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
                          lastName: familyLastName, 
                          birthDate: '', 
                          hebrewBirthDate: '', 
                          gender: '',
                          weddingDate: '',
                          spouseName: ''
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
                        {data.members.map((member) => {
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
                              <td className="p-4 font-medium text-gray-800">{member.firstName} {member.lastName}</td>
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-semibold">Payments</h3>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Payment
                  </button>
                </div>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Payment Method</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment: any) => {
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
                        <tr key={payment._id} className="border-b">
                          <td className="p-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td className="p-2 font-medium">${payment.amount.toLocaleString()}</td>
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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div>
                <div className="flex justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">Contact Information</h3>
                    <p className="text-sm text-gray-600">Manage family contact details</p>
                  </div>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <PencilIcon className="h-5 w-5" />
                    Edit Contacts
                  </button>
                </div>
                <div className="glass-strong rounded-xl p-6 border border-white/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Email</label>
                      <p className="text-gray-800">{data.family.email || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Phone</label>
                      <p className="text-gray-800">{data.family.phone || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Address</label>
                      <p className="text-gray-800">{data.family.address || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
                      <p className="text-gray-800">{data.family.city || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">State</label>
                      <p className="text-gray-800">{data.family.state || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">ZIP Code</label>
                      <p className="text-gray-800">{data.family.zip || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                  </div>
                </div>
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
                    {data.lifecycleEvents.map((event) => (
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
                        lastName: '',
                        birthDate: '',
                        hebrewBirthDate: '',
                        gender: '',
                        weddingDate: '',
                        spouseName: ''
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

        {showContactModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Contact Information</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                try {
                  const res = await fetch(`/api/kasa/families/${params.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactForm)
                  })
                  if (res.ok) {
                    setShowContactModal(false)
                    fetchFamilyDetails()
                  }
                } catch (error) {
                  console.error('Error updating contacts:', error)
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="family@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">ZIP Code</label>
                    <input
                      type="text"
                      value={contactForm.zip}
                      onChange={(e) => setContactForm({ ...contactForm, zip: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="12345"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700">Street Address</label>
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">City</label>
                    <input
                      type="text"
                      value={contactForm.city}
                      onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">State</label>
                    <input
                      type="text"
                      value={contactForm.state}
                      onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Save Contacts
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <Modal title="Add Payment" onClose={() => setShowPaymentModal(false)}>
            <form onSubmit={handleAddPayment} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod || 'cash'}
                  onChange={(e) => {
                    const selectedMethod = e.target.value as 'cash' | 'credit_card' | 'check' | 'quick_pay'
                    console.log('Payment method changed to:', selectedMethod)
                    setPaymentForm({ ...paymentForm, paymentMethod: selectedMethod })
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
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useStripe}
                        onChange={(e) => setUseStripe(e.target.checked)}
                        className="rounded"
                      />
                      <span>Use Stripe (Secure Payment)</span>
                    </label>
                  </div>
                  
                  {useStripe ? (
                    <StripePaymentForm
                      amount={paymentForm.amount}
                      familyId={params.id as string}
                      paymentDate={paymentForm.paymentDate}
                      year={paymentForm.year}
                      type={paymentForm.type}
                      notes={paymentForm.notes}
                      onSuccess={async (paymentIntentId) => {
                        setShowPaymentModal(false)
                        setUseStripe(false)
                        setPaymentForm({
                          amount: 0,
                          paymentDate: new Date().toISOString().split('T')[0],
                          year: new Date().getFullYear(),
                          type: 'membership',
                          paymentMethod: 'cash',
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
                  </>
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

