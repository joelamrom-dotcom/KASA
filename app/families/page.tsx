'use client'

import { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import AnalysisModal from '../components/AnalysisModal'

interface Family {
  familyId: string
  familyInfo: {
    name: string
    address: string
    phone: string
    email: string
    createdAt: string
    updatedAt: string
  }
  memberCount: number
  incomeRecordsCount: number
  calculationsCount: number
}

interface Member {
  id: string
  familyId: string
  name: string
  familyName: string
  address?: string
  phone?: string
  email?: string
  familySize: number
  firstYear: number
  memberRate: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false)
  const [showCreateMemberModal, setShowCreateMemberModal] = useState(false)
  const [activeTab, setActiveTab] = useState('families')
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  
  const [createFamilyForm, setCreateFamilyForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  
  const [createMemberForm, setCreateMemberForm] = useState({
    name: '',
    familyName: '',
    address: '',
    phone: '',
    email: '',
    familySize: 1,
    firstYear: new Date().getFullYear(),
    memberRate: 0,
    notes: ''
  })

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUser(user)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setLoading(false)
        // Redirect to login
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  // Fetch families when user is available
  useEffect(() => {
    const userId = user?.id || user?._id
    if (userId) {
      fetchFamilies()
    }
  }, [user])

  const fetchFamilies = async () => {
    try {
      setLoading(true)
      const userId = user?.id || user?._id
      console.log('Families Page - User object:', user)
      console.log('Families Page - Extracted userId:', userId)
      
      if (!userId) {
        console.error('Families Page - No user ID available', { user })
        setError('User ID not available')
        setLoading(false)
        return
      }
      
      console.log('Families Page - Making request with user-id header:', userId)
      const response = await fetch('/api/families', {
        headers: {
          'user-id': userId.toString(),
          'user-email': user?.email || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Ensure families is an array and filter out any invalid entries
        const validFamilies = Array.isArray(data.families) 
          ? data.families.filter((f: any) => f && f.familyId && f.familyInfo)
          : []
        setFamilies(validFamilies)
      } else {
        setError('Failed to fetch families')
      }
    } catch (error) {
      setError('Failed to fetch families')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async (familyId: string) => {
    try {
      const userId = user?.id || user?._id
      if (!userId) {
        setError('User ID not available')
        return
      }
      
      const response = await fetch(`/api/families/${familyId}/members`, {
        headers: {
          'user-id': userId
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Ensure members is an array and filter out any invalid entries
        const validMembers = Array.isArray(data.members)
          ? data.members.filter((m: any) => m && m.id)
          : []
        setMembers(validMembers)
      } else {
        setError('Failed to fetch members')
      }
    } catch (error) {
      setError('Failed to fetch members')
      console.error('Error:', error)
    }
  }

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createFamilyForm,
          userId: user?.id || user?._id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateFamilyModal(false)
        setCreateFamilyForm({
          name: '',
          address: '',
          phone: '',
          email: ''
        })
        fetchFamilies()
      } else {
        setError(data.error || 'Failed to create family')
      }
    } catch (error) {
      setError('Failed to create family')
      console.error('Error:', error)
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFamily) return
    
    try {
      const response = await fetch(`/api/families/${selectedFamily.familyId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createMemberForm,
          userId: user?.id || user?._id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateMemberModal(false)
        setCreateMemberForm({
          name: '',
          familyName: '',
          address: '',
          phone: '',
          email: '',
          familySize: 1,
          firstYear: new Date().getFullYear(),
          memberRate: 0,
          notes: ''
        })
        fetchMembers(selectedFamily.familyId)
      } else {
        setError(data.error || 'Failed to create member')
      }
    } catch (error) {
      setError('Failed to create member')
      console.error('Error:', error)
    }
  }

  const handleFamilySelect = (family: Family) => {
    setSelectedFamily(family)
    fetchMembers(family.familyId)
    setActiveTab('members')
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-red-100 text-red-800',
      'family_admin': 'bg-blue-100 text-blue-800',
      'member': 'bg-green-100 text-green-800',
      'viewer': 'bg-gray-100 text-gray-800'
    }
    return colors[role] || colors['member']
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'family_admin': 'Family Admin',
      'member': 'Member',
      'viewer': 'Viewer'
    }
    return labels[role] || role
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please log in to access family management</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading family management...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <div className="glass-panel mx-4 mt-6 mb-6 rounded-2xl px-6 py-4 animate-slide-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Family Management
          </h1>
          <div className="flex items-center space-x-3">
            <div className="glass-panel px-4 py-2 rounded-lg flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.firstName} {user.lastName}</span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-4 mb-6">
        <div className="glass-panel rounded-xl p-2 inline-flex space-x-2">
          <button
            onClick={() => setActiveTab('families')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === 'families'
                ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 scale-105'
                : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/80 hover:to-purple-500/80 hover:scale-105'
            }`}
          >
            <UserGroupIcon className="h-4 w-4 inline mr-2" />
            Families
          </button>
          {selectedFamily && (
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === 'members'
                  ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/80 hover:to-purple-500/80 hover:scale-105'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Members - {selectedFamily.familyInfo.name}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-4 pb-6">
        {activeTab === 'families' && (
          <div className="px-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-primary-500 flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Families</p>
                    <p className="text-2xl font-semibold text-gray-900">{families.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-green-500 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Members</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {families.reduce((sum, family) => sum + family.memberCount, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-blue-500 flex items-center justify-center">
                      <ShieldCheckIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Your Role</p>
                    <p className="text-2xl font-semibold text-gray-900">{getRoleLabel(user.role)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Families Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Families</h3>
                  <button
                    onClick={() => setShowCreateFamilyModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Family
                  </button>
                </div>
              </div>
              
              {families.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <UserGroupIcon className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No families yet</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first family</p>
                  <button
                    onClick={() => setShowCreateFamilyModal(true)}
                    className="btn-primary"
                  >
                    Create Family
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Records
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {families.filter(family => family && family.familyInfo).map((family) => (
                        <tr key={family.familyId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {family.familyInfo?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{family.familyInfo?.address || ''}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{family.familyInfo?.email || ''}</div>
                            <div className="text-sm text-gray-500">{family.familyInfo?.phone || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {family.memberCount || 0} members
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {family.incomeRecordsCount || 0} income records
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {family.familyInfo?.createdAt ? new Date(family.familyInfo.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleFamilySelect(family)}
                                className="text-blue-600 hover:text-blue-900" 
                                title="View Family"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setAnalysisData(family)
                                  setShowAnalysisModal(true)
                                }}
                                className="text-purple-600 hover:text-purple-900" 
                                title="Analyze Family"
                              >
                                <SparklesIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && selectedFamily && (
          <div className="px-4 sm:px-0">
            {/* Members Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Members - {selectedFamily.familyInfo?.name || 'Unknown Family'}
                  </h3>
                  <button
                    onClick={() => setShowCreateMemberModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Member
                  </button>
                </div>
              </div>
              
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <UserIcon className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                  <p className="text-gray-500 mb-4">Add members to this family</p>
                  <button
                    onClick={() => setShowCreateMemberModal(true)}
                    className="btn-primary"
                  >
                    Add Member
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.filter(member => member).map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.name || ''} {member.familyName || ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.email || ''}</div>
                            <div className="text-sm text-gray-500">{member.phone || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.familySize || 0} members
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => {
                                setAnalysisData(member)
                                setShowAnalysisModal(true)
                              }}
                              className="text-purple-600 hover:text-purple-900" 
                              title="Analyze Member"
                            >
                              <SparklesIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Family Modal */}
      {showCreateFamilyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Family</h3>
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={createFamilyForm.name}
                    onChange={(e) => setCreateFamilyForm({ ...createFamilyForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="input-field mt-1"
                    value={createFamilyForm.email}
                    onChange={(e) => setCreateFamilyForm({ ...createFamilyForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="input-field mt-1"
                    value={createFamilyForm.phone}
                    onChange={(e) => setCreateFamilyForm({ ...createFamilyForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    className="input-field mt-1"
                    rows={3}
                    value={createFamilyForm.address}
                    onChange={(e) => setCreateFamilyForm({ ...createFamilyForm, address: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateFamilyModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Create Family
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Member Modal */}
      {showCreateMemberModal && selectedFamily && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Member</h3>
              <form onSubmit={handleCreateMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createMemberForm.name}
                      onChange={(e) => setCreateMemberForm({ ...createMemberForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createMemberForm.familyName}
                      onChange={(e) => setCreateMemberForm({ ...createMemberForm, familyName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="input-field mt-1"
                    value={createMemberForm.email}
                    onChange={(e) => setCreateMemberForm({ ...createMemberForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="input-field mt-1"
                    value={createMemberForm.phone}
                    onChange={(e) => setCreateMemberForm({ ...createMemberForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    className="input-field mt-1"
                    rows={2}
                    value={createMemberForm.address}
                    onChange={(e) => setCreateMemberForm({ ...createMemberForm, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Family Size</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field mt-1"
                      value={createMemberForm.familySize}
                      onChange={(e) => setCreateMemberForm({ ...createMemberForm, familySize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Year</label>
                    <input
                      type="number"
                      className="input-field mt-1"
                      value={createMemberForm.firstYear}
                      onChange={(e) => setCreateMemberForm({ ...createMemberForm, firstYear: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={createMemberForm.memberRate}
                    onChange={(e) => setCreateMemberForm({ ...createMemberForm, memberRate: Number(e.target.value) })}
                    placeholder="$0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="input-field mt-1"
                    rows={3}
                    value={createMemberForm.notes}
                    onChange={(e) => setCreateMemberForm({ ...createMemberForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateMemberModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false)
          setAnalysisData(null)
        }}
        data={analysisData}
        title={analysisData ? (
          analysisData.familyInfo 
            ? `Analysis: ${analysisData.familyInfo.name || 'Family'}`
            : `Analysis: ${analysisData.name || ''} ${analysisData.familyName || ''}`
        ) : 'Analysis'}
      />
    </div>
  )
}
