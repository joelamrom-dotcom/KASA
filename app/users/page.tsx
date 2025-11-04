'use client'

import { useState, useEffect } from 'react'
import {
  UserIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import AnalysisModal from '../components/AnalysisModal'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  company: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface Activity {
  id: string
  type: string
  description: string
  userId: string
  metadata?: any
  createdAt: string
}

const ROLES = {
  super_admin: 'Super Admin',
  admin: 'Admin', 
  family_admin: 'Family Admin',
  member: 'Member',
  viewer: 'Viewer',
  user: 'User' // Legacy role
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userActivities, setUserActivities] = useState<Activity[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    isActive: true
  })
  const [editErrors, setEditErrors] = useState<{[key: string]: string}>({})
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUser(user)
        setIsAuthenticated(true)
        fetchUsers()
        fetchActivities()
      } else {
        setIsAuthenticated(false)
        setLoading(false)
        // Redirect to login
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      // Ensure data is an array
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    }
  }

  const handleEditRole = (user: User) => {
    setEditingUser(user.id)
    setEditRole(user.role)
  }

  const handleSaveRole = async (userId: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: editRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      // Update the user in the local state
      setUsers((users || []).map(user => 
        user.id === userId 
          ? { ...user, role: editRole, updatedAt: new Date().toISOString() }
          : user
      ))

      setEditingUser(null)
      setEditRole('')
      setError('') // Clear any previous errors
      
      // Refresh activities to show the new action
      fetchActivities()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditRole('')
  }

  const handleViewActions = (user: User) => {
    setSelectedUser(user)
    const userActions = activities.filter(activity => activity.userId === user.id)
    setUserActivities(userActions)
    setShowActionsModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      company: user.company || '',
      role: user.role,
      isActive: user.isActive
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!editForm.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    
    if (!editForm.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    
    if (!editForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!editForm.role) {
      errors.role = 'Role is required'
    }
    
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveUser = async () => {
    if (!validateEditForm() || !selectedUser) return
    
    try {
      setSaving(true)
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const updatedUser = await response.json()

      // Update the user in the local state
      setUsers((users || []).map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...editForm, updatedAt: new Date().toISOString() }
          : user
      ))

      setShowEditModal(false)
      setSelectedUser(null)
      setError('') // Clear any previous errors
      
      // Refresh activities to show the new action
      fetchActivities()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'family_admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'user_updated':
        return 'bg-blue-100 text-blue-800'
      case 'user_deleted':
        return 'bg-red-100 text-red-800'
      case 'user_created':
        return 'bg-green-100 text-green-800'
      case 'login':
        return 'bg-purple-100 text-purple-800'
      case 'project_created':
        return 'bg-indigo-100 text-indigo-800'
      case 'project_updated':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityCount = (userId: string) => {
    return activities.filter(activity => activity.userId === userId).length
  }

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">
                Manage user accounts and roles across the system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <UserIcon className="h-5 w-5" />
                <span>{(users || []).length} users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                {(users || []).map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowViewModal(true)
                    }}
                    title="Click to view user details"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.company || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {Object.entries(ROLES).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveRole(user.id)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {ROLES[user.role as keyof typeof ROLES] || user.role}
                          </span>
                          <button
                            onClick={() => handleEditRole(user)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.isActive)}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(user)
                            setShowViewModal(true)
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="View user details"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditUser(user)
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewActions(user)
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {getActivityCount(user.id)}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnalysisData(user)
                            setShowAnalysisModal(true)
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          title="Analyze user data"
                        >
                          <SparklesIcon className="h-3 w-3 mr-1" />
                          Analyze
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(users || []).length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new user account.
              </p>
            </div>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Role Descriptions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(ROLES).map(([key, label]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(key)}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {key === 'super_admin' && 'Full system access, can manage all families and users'}
                    {key === 'admin' && 'Can manage all families and their members'}
                    {key === 'family_admin' && 'Can manage own family and its members'}
                    {key === 'member' && 'Can view and edit own data within family'}
                    {key === 'viewer' && 'Can only view own data, no editing permissions'}
                    {key === 'user' && 'Legacy user role - limited permissions'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit User: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      editErrors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      editErrors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      editErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={editForm.company}
                    onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role *
                  </label>
                  <select
                    id="role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      editErrors.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a role</option>
                    {Object.entries(ROLES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {editErrors.role && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.role}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active User</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    setAnalysisData(selectedUser)
                    setShowEditModal(false)
                    setShowAnalysisModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Analyze This User
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {showActionsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Actions for {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setShowActionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {userActivities.length > 0 ? (
                  <div className="space-y-3">
                    {userActivities
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((activity) => (
                        <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                {formatActivityType(activity.type)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {new Date(activity.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">{activity.description}</p>
                          {activity.metadata && (
                            <div className="mt-2 text-xs text-gray-500">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(activity.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No actions found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This user hasn't performed any actions yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.company || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                        {ROLES[selectedUser.role as keyof typeof ROLES] || selectedUser.role}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedUser.isActive)}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    setAnalysisData(selectedUser)
                    setShowViewModal(false)
                    setShowAnalysisModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Analyze This User
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      handleEditUser(selectedUser)
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Close
                  </button>
                </div>
              </div>
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
        title={analysisData ? `Analysis: ${analysisData.firstName} ${analysisData.lastName}` : 'Analysis'}
      />
    </div>
  )
}
