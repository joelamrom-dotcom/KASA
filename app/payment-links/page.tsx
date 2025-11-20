'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon, DocumentDuplicateIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

interface PaymentLink {
  _id?: string
  familyId: string
  familyName?: string
  linkId: string
  linkUrl?: string
  amount?: number
  description?: string
  paymentPlan?: {
    enabled: boolean
    installments?: number
    frequency?: string
    startDate?: string
  }
  expiresAt?: string
  maxUses?: number
  currentUses?: number
  isActive: boolean
}

interface Family {
  _id: string
  name: string
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null)
  const [formData, setFormData] = useState<Partial<PaymentLink>>({
    familyId: '',
    amount: undefined,
    description: '',
    paymentPlan: { enabled: false },
    expiresAt: '',
    maxUses: undefined
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchLinks()
    fetchFamilies()
  }, [])

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payment-links', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setLinks(data)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFamilies = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/families', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setFamilies(data)
      }
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
          ...formData,
          _id: editingLink?._id,
          amount: formData.amount ? parseFloat(formData.amount.toString()) : undefined,
          maxUses: formData.maxUses ? parseInt(formData.maxUses.toString()) : undefined
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: editingLink ? 'Payment link updated successfully!' : 'Payment link created successfully!' })
        setShowModal(false)
        setEditingLink(null)
        setFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
        fetchLinks()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save payment link' })
      }
    } catch (error) {
      console.error('Error saving payment link:', error)
      setMessage({ type: 'error', text: 'Failed to save payment link' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment link?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/payment-links?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Payment link deleted successfully!' })
        fetchLinks()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete payment link' })
      }
    } catch (error) {
      console.error('Error deleting payment link:', error)
      setMessage({ type: 'error', text: 'Failed to delete payment link' })
    }
  }

  const handleEdit = (link: PaymentLink) => {
    setEditingLink(link)
    setFormData({
      familyId: link.familyId,
      amount: link.amount,
      description: link.description,
      paymentPlan: link.paymentPlan || { enabled: false },
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : '',
      maxUses: link.maxUses
    })
    setShowModal(true)
  }

  const copyLink = (linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl)
    setMessage({ type: 'success', text: 'Link copied to clipboard!' })
  }

  if (loading) {
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
            Payment Links
          </h1>
          <p className="text-gray-600">Create shareable payment links for families</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Payment Links</h2>
            <button
              onClick={() => {
                setEditingLink(null)
                setFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Payment Link
            </button>
          </div>

          {links.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <LinkIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No payment links found. Create your first payment link to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => (
                <div
                  key={link._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{link.familyName || 'Unknown Family'}</h3>
                        {link.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                      )}
                      {link.amount && (
                        <p className="text-lg font-semibold text-gray-800 mb-2">${link.amount.toLocaleString()}</p>
                      )}
                      {link.linkUrl && (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            readOnly
                            value={link.linkUrl}
                            className="flex-1 border rounded px-2 py-1 text-sm bg-gray-50"
                          />
                          <button
                            onClick={() => copyLink(link.linkUrl!)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Copy link"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
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
                        onClick={() => handleEdit(link)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(link._id!)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">{editingLink ? 'Edit Payment Link' : 'Create New Payment Link'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingLink(null)
                    setFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family *</label>
                  <select
                    required
                    value={formData.familyId}
                    onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a family</option>
                    {families.map((family) => (
                      <option key={family._id} value={family._id}>{family.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (optional - leave empty for custom amount)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Payment description..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.paymentPlan?.enabled || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        paymentPlan: { ...formData.paymentPlan, enabled: e.target.checked } as any
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Payment Plan</span>
                  </label>
                  {formData.paymentPlan?.enabled && (
                    <div className="ml-6 space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installments</label>
                        <input
                          type="number"
                          value={formData.paymentPlan.installments || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            paymentPlan: { ...formData.paymentPlan, installments: parseInt(e.target.value) } as any
                          })}
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={formData.paymentPlan.frequency || 'monthly'}
                          onChange={(e) => setFormData({
                            ...formData,
                            paymentPlan: { ...formData.paymentPlan, frequency: e.target.value } as any
                          })}
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt || ''}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
                  <input
                    type="number"
                    value={formData.maxUses || ''}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingLink(null)
                      setFormData({ familyId: '', amount: undefined, description: '', paymentPlan: { enabled: false }, expiresAt: '', maxUses: undefined })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
    </main>
  )
}

