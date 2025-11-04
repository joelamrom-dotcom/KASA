'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Family {
  _id: string
  name: string
  weddingDate: string
  email?: string
  phone?: string
  city?: string
  state?: string
  currentPlan: number
  currentPayment: number
  openBalance: number
  memberCount?: number
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFamily, setEditingFamily] = useState<Family | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    weddingDate: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    zip: '',
    currentPlan: 1,
    currentPayment: 0,
    openBalance: 0
  })

  useEffect(() => {
    fetchFamilies()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingFamily 
        ? `/api/kasa/families/${editingFamily._id}`
        : '/api/kasa/families'
      
      const method = editingFamily ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingFamily(null)
        resetForm()
        fetchFamilies()
      }
    } catch (error) {
      console.error('Error saving family:', error)
    }
  }

  const handleEdit = (family: Family) => {
    setEditingFamily(family)
    setFormData({
      name: family.name,
      weddingDate: new Date(family.weddingDate).toISOString().split('T')[0],
      address: '',
      phone: family.phone || '',
      email: family.email || '',
      city: family.city || '',
      state: family.state || '',
      zip: '',
      currentPlan: family.currentPlan,
      currentPayment: family.currentPayment,
      openBalance: family.openBalance
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
    setFormData({
      name: '',
      weddingDate: '',
      address: '',
      phone: '',
      email: '',
      city: '',
      state: '',
      zip: '',
      currentPlan: 1,
      currentPayment: 0,
      openBalance: 0
    })
  }

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

        <div className="glass-strong rounded-2xl shadow-xl overflow-hidden border border-white/30">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/20 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wedding Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-white/20">
              {families.map((family) => (
                <tr key={family._id} className="hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{family.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(family.weddingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    {family.memberCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">Plan {family.currentPlan}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${family.openBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/families/${family._id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
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
              ))}
            </tbody>
          </table>
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
  editing
}: {
  formData: any
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  editing: boolean
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
                className="w-full border rounded px-3 py-2"
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
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <label className="block text-sm font-medium mb-1">Current Plan</label>
              <select
                value={formData.currentPlan}
                onChange={(e) => setFormData({ ...formData, currentPlan: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={1}>Plan 1 (0-4 years) - $1,200</option>
                <option value={2}>Plan 2 (5-8 years) - $1,500</option>
                <option value={3}>Plan 3 (9-16 years) - $1,800</option>
                <option value={4}>Plan 4 (17+ years) - $2,500</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Open Balance</label>
              <input
                type="number"
                value={formData.openBalance}
                onChange={(e) => setFormData({ ...formData, openBalance: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded px-3 py-2"
              />
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

