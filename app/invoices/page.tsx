'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, DocumentTextIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [newInvoice, setNewInvoice] = useState({
    familyId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    dueDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/invoices', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newInvoice)
      })
      if (res.ok) {
        setShowCreateModal(false)
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  const autoGenerateInvoices = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/invoices/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ period: 'monthly' })
      })
      if (res.ok) {
        setShowAutoGenerateModal(false)
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error auto-generating invoices:', error)
    }
  }

  const generatePDF = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/invoices/${invoiceId}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        a.click()
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...newInvoice.items]
    items[index] = { ...items[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      items[index].amount = (items[index].quantity || 1) * (items[index].unitPrice || 0)
    }
    setNewInvoice({ ...newInvoice, items })
  }

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    })
  }

  const removeItem = (index: number) => {
    const items = newInvoice.items.filter((_, i) => i !== index)
    setNewInvoice({ ...newInvoice, items })
  }

  const total = newInvoice.items.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Invoices
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAutoGenerateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Auto-Generate
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Invoice
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(invoice.familyId as any)?.name || invoice.familyName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">${invoice.total?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => generatePDF(invoice._id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Download PDF"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Invoice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Family ID</label>
                <input
                  type="text"
                  value={newInvoice.familyId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, familyId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter family ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Items</label>
                <div className="space-y-2">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border rounded-lg"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border rounded-lg"
                        placeholder="Price"
                      />
                      <div className="w-24 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        ${item.amount.toFixed(2)}
                      </div>
                      {newInvoice.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addItem}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-lg font-semibold">Total: ${total.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showAutoGenerateModal} onClose={() => setShowAutoGenerateModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Auto-Generate Invoices</h2>
            <p className="text-gray-600 mb-4">
              This will generate invoices for all families based on their payment plans.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAutoGenerateModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={autoGenerateInvoices}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Generate Invoices
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

