'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

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

export default function PaymentPlansPage() {
  const [plans, setPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    yearlyPrice: 0
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/kasa/payment-plans')
      const data = await res.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching payment plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPlan 
        ? `/api/kasa/payment-plans/${editingPlan._id}`
        : '/api/kasa/payment-plans'
      
      const method = editingPlan ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingPlan(null)
        resetForm()
        fetchPlans()
      }
    } catch (error) {
      console.error('Error saving payment plan:', error)
    }
  }

  const handleEdit = (plan: PaymentPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      yearlyPrice: plan.yearlyPrice
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment plan?')) return
    
    try {
      const res = await fetch(`/api/kasa/payment-plans/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Error deleting payment plan:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      yearlyPrice: 0
    })
  }

  const toggleExpand = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId)
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Payment Plans
            </h1>
            <p className="text-gray-600">Manage payment plans and view families using each plan</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setEditingPlan(null)
              setShowModal(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            Add Payment Plan
          </button>
        </div>

        <div className="glass-strong rounded-2xl shadow-xl overflow-hidden border border-white/30">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/20 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Yearly Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Monthly Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Families</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-white/20">
              {plans.map((plan, index) => {
                const planNumber = index + 1
                const isExpanded = expandedPlan === plan._id
                return (
                  <React.Fragment key={plan._id}>
                    <tr className="hover:bg-white/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer text-left"
                        >
                          {plan.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        ${plan.yearlyPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        ${(plan.yearlyPrice / 12).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleExpand(plan._id)}
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
                          onClick={() => handleEdit(plan)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Edit Plan"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Plan"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && plan.families && plan.families.length > 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-white/5">
                          <div className="ml-8">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Families using this plan:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {plan.families.map((family) => (
                                <Link
                                  key={family._id}
                                  href={`/families/${family._id}`}
                                  className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
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
                        <td colSpan={5} className="px-6 py-4 bg-white/5">
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

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {editingPlan ? 'Edit' : 'Add'} Payment Plan
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    value={formData.yearlyPrice}
                    onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingPlan(null)
                      resetForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {editingPlan ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
