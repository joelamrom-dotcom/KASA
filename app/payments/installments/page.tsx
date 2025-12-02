'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newInstallment, setNewInstallment] = useState({
    familyId: '',
    totalAmount: '',
    numberOfInstallments: '',
    frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly' | 'quarterly',
    startDate: ''
  })

  useEffect(() => {
    fetchInstallments()
  }, [])

  const fetchInstallments = async () => {
    // Would fetch from API
    setLoading(false)
  }

  const createInstallment = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/installments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newInstallment)
      })
      if (res.ok) {
        setShowCreateModal(false)
        fetchInstallments()
      }
    } catch (error) {
      console.error('Error creating installment:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Payment Installments
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Installment Plan
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : installments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No installment plans found</div>
          ) : (
            <div className="space-y-4">
              {installments.map((plan) => (
                <div key={plan._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">${plan.totalAmount} over {plan.numberOfInstallments} payments</h3>
                      <p className="text-sm text-gray-500">Frequency: {plan.frequency}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      plan.status === 'active' ? 'bg-green-100 text-green-700' :
                      plan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create Installment Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Family ID</label>
                <input
                  type="text"
                  value={newInstallment.familyId}
                  onChange={(e) => setNewInstallment({ ...newInstallment, familyId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount</label>
                <input
                  type="number"
                  value={newInstallment.totalAmount}
                  onChange={(e) => setNewInstallment({ ...newInstallment, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Installments</label>
                <input
                  type="number"
                  value={newInstallment.numberOfInstallments}
                  onChange={(e) => setNewInstallment({ ...newInstallment, numberOfInstallments: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={newInstallment.frequency}
                  onChange={(e) => setNewInstallment({ ...newInstallment, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newInstallment.startDate}
                  onChange={(e) => setNewInstallment({ ...newInstallment, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
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
                  onClick={createInstallment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

