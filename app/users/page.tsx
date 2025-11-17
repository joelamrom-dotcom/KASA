'use client'

import { useState, useEffect } from 'react'
import { getUser } from '@/lib/auth'
import {
  UsersIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { setAuth } from '@/lib/auth'
import ConfirmationDialog from '@/app/components/ConfirmationDialog'
import { showToast } from '@/app/components/Toast'
import { TableSkeleton } from '@/app/components/LoadingSkeleton'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'super_admin' | 'admin' | 'user' | 'viewer'
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  profilePicture?: string
}

const ROLES = {
  super_admin: 'Super Admin',
  admin: 'Admin', 
  user: 'User',
  viewer: 'Viewer'
}

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
  admin: 'bg-blue-100 text-blue-800 border-blue-300',
  user: 'bg-gray-100 text-gray-800 border-gray-300',
  viewer: 'bg-green-100 text-green-800 border-green-300'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'admin' as User['role'],
    isActive: true
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  useEffect(() => {
    const checkAndRefresh = async () => {
      const user = getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      
      // Clear any previous errors
      setError('')
      
      // Note: DB fallback in API routes handles access for joelamrom@gmail.com
      // The /api/users endpoint will check DB and grant access if role is super_admin
      // So we can proceed directly to fetch users
      setCurrentUser(user)
      fetchUsers()
    }
    
    checkAndRefresh()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('') // Clear error before making request
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Prevent caching
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        if (response.status === 403) {
          throw new Error(errorData.error || 'Access denied: Super admin access required')
        }
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      
      const data = await response.json()
      const usersList = Array.isArray(data) ? data : []
      setUsers(usersList)
      setError('') // Clear any previous errors on success
      
      // If we successfully loaded users, ensure error is cleared
      if (usersList.length > 0) {
        setError('')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUserId(user._id)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    })
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'admin',
      isActive: true
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUserId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update user')
      }

      const updatedUser = await response.json()
      setUsers(users.map(u => u._id === editingUserId ? updatedUser : u))
      setEditingUserId(null)
      setError('') // Clear any previous errors on success
      showToast('User updated successfully', 'success')
    } catch (err) {
      // Don't set main error state for PUT errors - only show toast
      // The banner should only show for GET errors (when users.length === 0)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      showToast(errorMessage, 'error')
    }
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to delete user')
      }

      setUsers(users.filter(u => u._id !== userToDelete._id))
      setShowDeleteDialog(false)
      setUserToDelete(null)
      setError('') // Clear any previous errors on success
      showToast('User deleted successfully', 'success')
    } catch (err) {
      // Don't set main error state for DELETE errors - only show toast
      // The banner should only show for GET errors (when users.length === 0)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      showToast(errorMessage, 'error')
    }
  }

  const handleImpersonate = async (user: User) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${user._id}/impersonate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to impersonate user')
      }

      const data = await response.json()
      
      // Set the new token and user data
      setAuth(data.token, data.user)
      
      // Redirect to dashboard
      window.location.href = '/'
    } catch (err) {
      // Don't set main error state for impersonate errors - only show toast
      // The banner should only show for GET errors (when users.length === 0)
      const errorMessage = err instanceof Error ? err.message : 'Failed to impersonate user'
      showToast(errorMessage, 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/30 backdrop-blur-sm">
            <UsersIcon className="h-8 w-8 text-blue-700" />
          </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users and their roles</p>
          </div>
          </div>
        </div>

        {/* Error Message - Only show if we have an error AND no users loaded */}
        {error && users.length === 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          </div>
        )}

        {/* Users Table */}
      <div className="glass-strong rounded-xl border border-white/30 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user._id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="First Name"
                          />
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Last Name"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/30 flex items-center justify-center">
                              <UserCircleIcon className="h-6 w-6 text-blue-700" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                            </div>
                            {user.lastLogin && (
                              <div className="text-xs text-gray-500">
                                Last login: {formatDate(user.lastLogin)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user._id ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Email"
                        />
                      ) : (
                      <div className="text-sm text-gray-900">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user._id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Object.entries(ROLES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                          {ROLES[user.role] || user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user._id ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingUserId === user._id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleImpersonate(user)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Login as User"
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          {user._id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onCancel={() => {
          setShowDeleteDialog(false)
          setUserToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

    </div>
  )
}
