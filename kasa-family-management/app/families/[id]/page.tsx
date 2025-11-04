'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface FamilyDetails {
  family: any
  members: any[]
  payments: any[]
  withdrawals: any[]
  lifecycleEvents: any[]
  balance: any
}

export default function FamilyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<FamilyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'payments' | 'events'>('overview')
  
  // Check URL params for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'members') {
      setActiveTab('members')
      // Auto-open modal if coming from quick add
      if (urlParams.get('add') === 'true') {
        setShowMemberModal(true)
      }
    }
  }, [])
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [memberForm, setMemberForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female'
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    type: 'membership' as 'membership' | 'donation' | 'other',
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
    }
  }, [params.id])

  const fetchFamilyDetails = async () => {
    try {
      const res = await fetch(`/api/kasa/families/${params.id}`)
      const data = await res.json()
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
        setMemberForm({ firstName: '', lastName: '', birthDate: '', gender: 'male' })
        fetchFamilyDetails()
      }
    } catch (error) {
      console.error('Error adding member:', error)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/kasa/families/' + params.id + '/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentForm, familyId: params.id })
      })
      if (res.ok) {
        setShowPaymentModal(false)
        setPaymentForm({
          amount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          year: new Date().getFullYear(),
          type: 'membership',
          notes: ''
        })
        fetchFamilyDetails()
      }
    } catch (error) {
      console.error('Error adding payment:', error)
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
        setEventForm({
          eventType: 'chasena',
          amount: 12180,
          eventDate: new Date().toISOString().split('T')[0],
          year: new Date().getFullYear(),
          notes: ''
        })
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

  if (!data) {
    return <div className="min-h-screen p-8">Family not found</div>
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

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{data.family.name}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Wedding Date</p>
              <p className="font-medium">{new Date(data.family.weddingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <p className="font-medium">Plan {data.family.currentPlan}</p>
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
                { id: 'events', label: 'Lifecycle Events' }
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    onClick={() => setShowMemberModal(true)}
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
                      onClick={() => setShowMemberModal(true)}
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
                          <th className="text-left p-4 font-semibold text-gray-700">Current Age</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Payment Plan</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Gender</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/10 divide-y divide-white/20">
                        {data.members.map((member) => {
                          const today = new Date()
                          const birthDate = new Date(member.birthDate)
                          let age = today.getFullYear() - birthDate.getFullYear()
                          const monthDiff = today.getMonth() - birthDate.getMonth()
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--
                          }
                          
                          // Determine payment plan based on age
                          let planText = ''
                          let planColor = ''
                          if (age >= 0 && age <= 4) {
                            planText = 'Plan 1 (0-4) - $1,200'
                            planColor = 'text-blue-600'
                          } else if (age >= 5 && age <= 8) {
                            planText = 'Plan 2 (5-8) - $1,500'
                            planColor = 'text-green-600'
                          } else if (age >= 9 && age <= 16) {
                            planText = 'Plan 3 (9-16) - $1,800'
                            planColor = 'text-purple-600'
                          } else {
                            planText = 'Plan 4 (17+) - $2,500'
                            planColor = 'text-orange-600'
                          }
                          
                          return (
                            <tr key={member._id} className="hover:bg-white/20 transition-colors">
                              <td className="p-4 font-medium text-gray-800">{member.firstName} {member.lastName}</td>
                              <td className="p-4 text-gray-600">{new Date(member.birthDate).toLocaleDateString()}</td>
                              <td className="p-4">
                                <span className="font-semibold text-gray-800">{age}</span>
                                <span className="text-gray-500 text-sm ml-1">years</span>
                              </td>
                              <td className={`p-4 font-medium ${planColor}`}>{planText}</td>
                              <td className="p-4 capitalize text-gray-600">{member.gender || '-'}</td>
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
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment._id} className="border-b">
                        <td className="p-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">${payment.amount.toLocaleString()}</td>
                        <td className="p-2 capitalize">{payment.type}</td>
                        <td className="p-2">{payment.year}</td>
                        <td className="p-2 text-gray-600">{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          </div>
        </div>

        {showMemberModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Add Child</h2>
              <p className="text-sm text-gray-600 mb-6">The child's age determines which payment plan applies</p>
              <form onSubmit={handleAddMember} className="space-y-5">
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
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Birth Date *</label>
                  <input
                    type="date"
                    required
                    value={memberForm.birthDate}
                    onChange={(e) => setMemberForm({ ...memberForm, birthDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used to calculate age and payment plan</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Gender</label>
                  <select
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                {memberForm.birthDate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-800 mb-1">Payment Plan Preview:</p>
                    {(() => {
                      const today = new Date()
                      const birthDate = new Date(memberForm.birthDate)
                      let age = today.getFullYear() - birthDate.getFullYear()
                      const monthDiff = today.getMonth() - birthDate.getMonth()
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--
                      }
                      let planInfo = ''
                      if (age >= 0 && age <= 4) planInfo = 'Plan 1 (0-4 years) - $1,200/year'
                      else if (age >= 5 && age <= 8) planInfo = 'Plan 2 (5-8 years) - $1,500/year'
                      else if (age >= 9 && age <= 16) planInfo = 'Plan 3 (9-16 years) - $1,800/year'
                      else planInfo = 'Plan 4 (17+ years) - $2,500/year'
                      return <p className="text-sm text-blue-700">{planInfo}</p>
                    })()}
                  </div>
                )}
                <div className="flex gap-4 justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowMemberModal(false)} 
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Add Child
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
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Add Payment
                </button>
              </div>
            </form>
          </Modal>
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
                  <option value="chasena">Chasena (Wedding) - $12,180</option>
                  <option value="bar_mitzvah">Bar Mitzvah - $1,800</option>
                  <option value="birth_boy">Birth Boy - $500</option>
                  <option value="birth_girl">Birth Girl - $500</option>
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

