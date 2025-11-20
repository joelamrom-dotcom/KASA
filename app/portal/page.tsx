'use client'

import { useState, useEffect } from 'react'
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface Payment {
  _id: string
  amount: number
  paymentDate: string
  paymentMethod: string
  type: string
  year?: number
  notes?: string
}

interface Document {
  _id: string
  name: string
  description?: string
  category: string
  fileUrl: string
  fileSize: number
  createdAt: string
}

interface SupportTicket {
  _id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  messages: Array<{
    from: string
    message: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

interface ContactInfo {
  email?: string
  phone?: string
  husbandCellPhone?: string
  wifeCellPhone?: string
  address?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  receiveEmails?: boolean
  receiveSMS?: boolean
}

export default function PortalPage() {
  const router = useRouter()
  const user = getUser()
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'documents' | 'contact' | 'support'>('overview')
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo>({})
  const [familyData, setFamilyData] = useState<any>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showTicketDetail, setShowTicketDetail] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState<ContactInfo>({})
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium'
  })
  const [newMessage, setNewMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Redirect if not a family user
    if (user && user.role !== 'family') {
      router.push('/')
      return
    }
    
    if (user) {
      fetchData()
    }
  }, [user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      // Fetch all data in parallel
      const [familyRes, paymentsRes, documentsRes, ticketsRes, contactRes] = await Promise.all([
        fetch('/api/kasa/families/me', { headers }),
        fetch('/api/kasa/portal/payments?limit=10', { headers }),
        fetch('/api/kasa/portal/documents', { headers }),
        fetch('/api/kasa/portal/support-tickets?limit=5', { headers }),
        fetch('/api/kasa/portal/contact', { headers })
      ])

      if (familyRes.ok) {
        const familyData = await familyRes.json()
        setFamilyData(familyData)
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(data.payments || [])
      }

      if (documentsRes.ok) {
        const data = await documentsRes.json()
        setDocuments(data.documents || [])
      }

      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(data.tickets || [])
      }

      if (contactRes.ok) {
        const data = await contactRes.json()
        setContactInfo(data)
        setContactForm(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/portal/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(contactForm)
      })

      if (res.ok) {
        const data = await res.json()
        setContactInfo(data.family)
        setShowContactModal(false)
        alert('Contact information updated successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update contact information')
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Failed to update contact information')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/portal/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(ticketForm)
      })

      if (res.ok) {
        const ticket = await res.json()
        setTickets([ticket, ...tickets])
        setShowTicketModal(false)
        setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' })
        alert('Support ticket created successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create support ticket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert('Failed to create support ticket')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMessage = async (ticketId: string) => {
    if (!newMessage.trim()) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/portal/support-tickets/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: newMessage })
      })

      if (res.ok) {
        const updatedTicket = await res.json()
        setTickets(tickets.map(t => t._id === ticketId ? updatedTicket : t))
        setNewMessage('')
        fetchData() // Refresh to get latest messages
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add message')
      }
    } catch (error) {
      console.error('Error adding message:', error)
      alert('Failed to add message')
    } finally {
      setSaving(false)
    }
  }

  const downloadDocument = (document: Document) => {
    window.open(document.fileUrl, '_blank')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Member Portal</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {familyData?.family?.name || user?.firstName || 'Family'}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'payments', label: 'Payment History', icon: CreditCardIcon },
              { id: 'documents', label: 'Documents', icon: DocumentArrowDownIcon },
              { id: 'contact', label: 'Contact Info', icon: PencilIcon },
              { id: 'support', label: 'Support', icon: ChatBubbleLeftRightIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Paid This Year</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(familyData?.totalPaidThisYear || 0)}
                    </p>
                  </div>
                  <CreditCardIcon className="h-12 w-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recent Payments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {payments.length}
                    </p>
                  </div>
                  <ClockIcon className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Support Tickets</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
                    </p>
                  </div>
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Recent Payments</h2>
              </div>
              <div className="p-6">
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment._id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                        </div>
                        <span className="text-sm text-gray-600 capitalize">{payment.paymentMethod}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No payments found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Payment History</h2>
            </div>
            <div className="p-6">
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {payment.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.year || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No payment history found</p>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>
            <div className="p-6">
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span className="capitalize">{doc.category}</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No documents available</p>
              )}
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <button
                onClick={() => setShowContactModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PencilIcon className="h-5 w-5" />
                Edit
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    {contactInfo.email || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    {contactInfo.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Husband Cell Phone</label>
                  <p className="mt-1 text-gray-900">{contactInfo.husbandCellPhone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Wife Cell Phone</label>
                  <p className="mt-1 text-gray-900">{contactInfo.wifeCellPhone || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    {contactInfo.address || contactInfo.street || 'Not provided'}
                    {contactInfo.city && `, ${contactInfo.city}`}
                    {contactInfo.state && `, ${contactInfo.state}`}
                    {contactInfo.zip && ` ${contactInfo.zip}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="mt-1 text-gray-900">
                    {contactInfo.receiveEmails ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                  <p className="mt-1 text-gray-900">
                    {contactInfo.receiveSMS ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Support Tickets</h2>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Ticket
                </button>
              </div>
              <div className="p-6">
                {tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setShowTicketDetail(ticket._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(ticket.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No support tickets yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Edit Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Contact Information</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateContact} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email || ''}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactForm.phone || ''}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Husband Cell Phone</label>
                  <input
                    type="tel"
                    value={contactForm.husbandCellPhone || ''}
                    onChange={(e) => setContactForm({ ...contactForm, husbandCellPhone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Wife Cell Phone</label>
                  <input
                    type="tel"
                    value={contactForm.wifeCellPhone || ''}
                    onChange={(e) => setContactForm({ ...contactForm, wifeCellPhone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    value={contactForm.street || contactForm.address || ''}
                    onChange={(e) => setContactForm({ ...contactForm, street: e.target.value, address: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={contactForm.city || ''}
                    onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={contactForm.state || ''}
                    onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={contactForm.zip || ''}
                    onChange={(e) => setContactForm({ ...contactForm, zip: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contactForm.receiveEmails ?? true}
                      onChange={(e) => setContactForm({ ...contactForm, receiveEmails: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Receive Email Notifications</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contactForm.receiveSMS ?? true}
                      onChange={(e) => setContactForm({ ...contactForm, receiveSMS: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Receive SMS Notifications</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Support Ticket</h2>
              <button
                onClick={() => setShowTicketModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="payment">Payment</option>
                    <option value="account">Account</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketDetail && (() => {
        const ticket = tickets.find(t => t._id === showTicketDetail)
        if (!ticket) return null
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{ticket.subject}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTicketDetail(null)
                    setNewMessage('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Initial Message</h3>
                  <p className="text-gray-700">{ticket.description}</p>
                </div>
                
                {ticket.messages && ticket.messages.length > 1 && (
                  <div>
                    <h3 className="font-semibold mb-2">Conversation</h3>
                    <div className="space-y-4">
                      {ticket.messages.slice(1).map((msg, idx) => (
                        <div key={idx} className={`p-4 rounded-lg ${
                          msg.from === 'family' ? 'bg-blue-50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {msg.from === 'family' ? 'You' : 'Support Team'}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.status !== 'closed' && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Add a Message</h3>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 mb-2"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={() => handleAddMessage(ticket._id)}
                      disabled={!newMessage.trim() || saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

