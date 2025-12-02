'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PauseIcon, PlayIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'
import { Calendar } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function RecurringPaymentsPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [newPlan, setNewPlan] = useState({
    familyId: '',
    amount: '',
    frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly',
    startDate: '',
    endDate: '',
    description: ''
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/recurring', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching recurring payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newPlan)
      })
      if (res.ok) {
        setShowCreateModal(false)
        fetchPlans()
      }
    } catch (error) {
      console.error('Error creating plan:', error)
    }
  }

  const togglePlan = async (planId: string, action: 'pause' | 'resume') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/payments/recurring/${planId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Error toggling plan:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Recurring Payments
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Recurring Payment
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No recurring payment plans found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">${plan.amount} / {plan.frequency}</h3>
                    <p className="text-sm text-gray-500">{plan.description || 'Recurring payment'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    plan.status === 'active' ? 'bg-green-100 text-green-700' :
                    plan.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span>Starts: {new Date(plan.startDate).toLocaleDateString()}</span>
                  </div>
                  {plan.endDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>Ends: {new Date(plan.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                    <span>Next payment: {plan.nextPaymentDate ? new Date(plan.nextPaymentDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {plan.status === 'active' ? (
                    <button
                      onClick={() => togglePlan(plan._id, 'pause')}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1 text-sm"
                    >
                      <PauseIcon className="h-4 w-4" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => togglePlan(plan._id, 'resume')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                    >
                      <PlayIcon className="h-4 w-4" />
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                  >
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create Recurring Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Family ID</label>
                <input
                  type="text"
                  value={newPlan.familyId}
                  onChange={(e) => setNewPlan({ ...newPlan, familyId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={newPlan.amount}
                  onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={newPlan.frequency}
                  onChange={(e) => setNewPlan({ ...newPlan, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newPlan.startDate}
                  onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={newPlan.endDate}
                  onChange={(e) => setNewPlan({ ...newPlan, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
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
                  onClick={createPlan}
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
