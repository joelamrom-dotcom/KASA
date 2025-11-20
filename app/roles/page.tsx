'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  KeyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'
import ConfirmationDialog from '@/app/components/ConfirmationDialog'
import { showToast } from '@/app/components/Toast'
import { TableSkeleton } from '@/app/components/LoadingSkeleton'
import EmptyState from '@/app/components/EmptyState'

interface Permission {
  _id: string
  name: string
  displayName: string
  module: string
  action: string
  description?: string
}

interface Role {
  _id: string
  name: string
  displayName: string
  description?: string
  isSystem: boolean
  isDefault: boolean
  permissions: Permission[]
  userCount?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    email: string
    firstName?: string
    lastName?: string
  }
}

interface PermissionGroup {
  module: string
  permissions: Permission[]
  expanded: boolean
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
    isDefault: false,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSystem, setFilterSystem] = useState<'all' | 'system' | 'custom'>('all')
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [permissionSearch, setPermissionSearch] = useState('')
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [newPermission, setNewPermission] = useState({
    name: '',
    displayName: '',
    module: '',
    action: '',
    description: '',
  })

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
    fetchUserCounts()
  }, [])

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/roles', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles || [])
      } else {
        showToast('Failed to load roles', 'error')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      showToast('Error loading roles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/permissions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setPermissions(data.permissions || [])
        // Expand all modules by default
        const modules = new Set<string>(data.permissions.map((p: Permission) => p.module))
        setExpandedModules(modules)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchUserCounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const userCounts: Record<string, number> = {}
        data.users?.forEach((user: any) => {
          if (user.role) {
            userCounts[user.role] = (userCounts[user.role] || 0) + 1
          }
        })
        setRoles(prev => prev.map(role => ({
          ...role,
          userCount: userCounts[role.name] || 0
        })))
      }
    } catch (error) {
      console.error('Error fetching user counts:', error)
    }
  }

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = 
        role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = 
        filterSystem === 'all' ||
        (filterSystem === 'system' && role.isSystem) ||
        (filterSystem === 'custom' && !role.isSystem)
      
      return matchesSearch && matchesFilter
    })
  }, [roles, searchQuery, filterSystem])

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {}
    permissions.forEach(perm => {
      if (!groups[perm.module]) {
        groups[perm.module] = []
      }
      groups[perm.module].push(perm)
    })
    return groups
  }, [permissions])

  const filteredPermissions = useMemo(() => {
    if (!permissionSearch) return permissions
    const query = permissionSearch.toLowerCase()
    return permissions.filter(p => 
      p.displayName.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.module.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  }, [permissions, permissionSearch])

  const handleCreate = () => {
    setEditingRole(null)
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      isDefault: false,
    })
    setShowModal(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions.map(p => p._id),
      isDefault: role.isDefault,
    })
    setShowModal(true)
  }

  const handleCopy = (role: Role) => {
    setEditingRole(null)
    setFormData({
      name: `${role.name}_copy`,
      displayName: `${role.displayName} (Copy)`,
      description: role.description || '',
      permissions: role.permissions.map(p => p._id),
      isDefault: false,
    })
    setShowModal(true)
  }

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!roleToDelete) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/roles/${roleToDelete._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        showToast('Role deleted successfully', 'success')
        fetchRoles()
        setShowDeleteDialog(false)
        setRoleToDelete(null)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete role', 'error')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      showToast('Error deleting role', 'error')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRoles.size === 0) return

    try {
      const token = localStorage.getItem('token')
      const promises = Array.from(selectedRoles).map(id => 
        fetch(`/api/roles/${id}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
      )
      
      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok).length
      
      if (failed === 0) {
        showToast(`Successfully deleted ${selectedRoles.size} role(s)`, 'success')
        setSelectedRoles(new Set())
        fetchRoles()
      } else {
        showToast(`Failed to delete ${failed} role(s)`, 'error')
      }
    } catch (error) {
      showToast('Error deleting roles', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const url = editingRole ? `/api/roles/${editingRole._id}` : '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        showToast(editingRole ? 'Role updated successfully' : 'Role created successfully', 'success')
        fetchRoles()
        setShowModal(false)
        setEditingRole(null)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to save role', 'error')
      }
    } catch (error) {
      console.error('Error saving role:', error)
      showToast('Error saving role', 'error')
    }
  }

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newPermission),
      })

      if (res.ok) {
        showToast('Permission created successfully', 'success')
        fetchPermissions()
        setShowPermissionModal(false)
        setNewPermission({
          name: '',
          displayName: '',
          module: '',
          action: '',
          description: '',
        })
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to create permission', 'error')
      }
    } catch (error) {
      console.error('Error creating permission:', error)
      showToast('Error creating permission', 'error')
    }
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(module)) {
        next.delete(module)
      } else {
        next.add(module)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedRoles.size === filteredRoles.filter(r => !r.isSystem).length) {
      setSelectedRoles(new Set())
    } else {
      setSelectedRoles(new Set(filteredRoles.filter(r => !r.isSystem).map(r => r._id)))
    }
  }

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) {
        next.delete(roleId)
      } else {
        next.add(roleId)
      }
      return next
    })
  }

  const selectAllPermissions = (module: string) => {
    const modulePerms = groupedPermissions[module] || []
    const modulePermIds = modulePerms.map(p => p._id)
    const allSelected = modulePermIds.every(id => formData.permissions.includes(id))
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(id => !modulePermIds.includes(id))
        : [...new Set([...prev.permissions, ...modulePermIds])],
    }))
  }

  const exportRoles = () => {
    const data = filteredRoles.map(role => ({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions.map(p => p.name).join(', '),
      userCount: role.userCount || 0,
      isDefault: role.isDefault,
      isSystem: role.isSystem,
    }))
    
    const csv = [
      ['Name', 'Display Name', 'Description', 'Permissions', 'Users', 'Default', 'System'],
      ...data.map(r => [
        r.name,
        r.displayName,
        r.description,
        r.permissions,
        r.userCount.toString(),
        r.isDefault ? 'Yes' : 'No',
        r.isSystem ? 'Yes' : 'No',
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roles_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Roles exported successfully', 'success')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/30 backdrop-blur-sm">
              <ShieldCheckIcon className="h-8 w-8 text-blue-700" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Roles & Permissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage user roles and their granular permissions across the system
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <select
                value={filterSystem}
                onChange={e => setFilterSystem(e.target.value as 'all' | 'system' | 'custom')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Roles</option>
                <option value="system">System Roles</option>
                <option value="custom">Custom Roles</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={exportRoles}
                className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export
              </button>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <KeyIcon className="h-5 w-5" />
                New Permission
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5" />
                Create Role
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedRoles.size > 0 && (
          <div className="mb-6 p-4 glass-strong rounded-xl border border-white/30 backdrop-blur-sm flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {selectedRoles.size} role(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <TrashIcon className="h-5 w-5" />
              Delete Selected
            </button>
          </div>
        )}

        {/* Roles Grid */}
        {filteredRoles.length === 0 ? (
          <EmptyState
            icon={<ShieldCheckIcon className="h-16 w-16 text-gray-400 dark:text-gray-600" />}
            title="No roles found"
            description={searchQuery ? "Try adjusting your search or filters" : "Create your first role to get started"}
            action={!searchQuery ? {
              label: "Create Role",
              onClick: handleCreate
            } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map(role => (
              <div
                key={role._id}
                className={`glass-strong rounded-2xl shadow-xl p-6 border-2 transition-all hover:shadow-2xl ${
                  selectedRoles.has(role._id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/30'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {!role.isSystem && (
                      <input
                        type="checkbox"
                        checked={selectedRoles.has(role._id)}
                        onChange={() => toggleRoleSelection(role._id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheckIcon className={`h-6 w-6 ${
                          role.isSystem ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {role.displayName}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {role.isSystem && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                            System
                          </span>
                        )}
                        {role.isDefault && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            Default
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {role.userCount || 0} users
                        </span>
                      </div>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(role)}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Duplicate Role"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit Role"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(role)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Role"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {role.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-white/20 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Permissions
                    </p>
                    <span className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full">
                      {role.permissions.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {role.permissions.slice(0, 6).map(perm => (
                      <span
                        key={perm._id}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md"
                      >
                        {perm.displayName}
                      </span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
                        +{role.permissions.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Role Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditingRole(null)
          }}
          title={editingRole ? 'Edit Role' : 'Create Role'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name (internal) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                  disabled={!!editingRole}
                  placeholder="e.g., accountant, manager"
                  pattern="[a-z0-9_]+"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                  placeholder="e.g., Accountant, Manager"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Describe what this role is for..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Set as default role for new users
                </span>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permissions ({formData.permissions.length} selected)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={e => setPermissionSearch(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, permissions: permissions.map(p => p._id) }))}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
                {Object.entries(groupedPermissions)
                  .filter(([module]) => {
                    if (!permissionSearch) return true
                    const modulePerms = groupedPermissions[module] || []
                    return modulePerms.some(p => 
                      p.displayName.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                      p.name.toLowerCase().includes(permissionSearch.toLowerCase())
                    )
                  })
                  .map(([module, perms]) => {
                    const modulePerms = permissionSearch 
                      ? perms.filter(p => 
                          p.displayName.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                          p.name.toLowerCase().includes(permissionSearch.toLowerCase())
                        )
                      : perms
                    
                    if (modulePerms.length === 0) return null
                    
                    const allSelected = modulePerms.every(p => formData.permissions.includes(p._id))
                    const someSelected = modulePerms.some(p => formData.permissions.includes(p._id))
                    
                    return (
                      <div key={module} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => toggleModule(module)}
                            className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {expandedModules.has(module) ? (
                              <ChevronDownIcon className="h-5 w-5" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5" />
                            )}
                            <span className="capitalize">{module.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-gray-500">({modulePerms.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => selectAllPermissions(module)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        {expandedModules.has(module) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                            {modulePerms.map(perm => {
                              const isSelected = formData.permissions.includes(perm._id)
                              return (
                                <label
                                  key={perm._id}
                                  className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePermission(perm._id)}
                                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <span className={`text-sm font-medium ${
                                      isSelected 
                                        ? 'text-blue-900 dark:text-blue-100' 
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {perm.displayName}
                                    </span>
                                    {perm.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingRole(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Create Permission Modal */}
        <Modal
          isOpen={showPermissionModal}
          onClose={() => {
            setShowPermissionModal(false)
            setNewPermission({
              name: '',
              displayName: '',
              module: '',
              action: '',
              description: '',
            })
          }}
          title="Create New Permission"
        >
          <form onSubmit={handleCreatePermission} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permission Name (internal) *
              </label>
              <input
                type="text"
                value={newPermission.name}
                onChange={e => setNewPermission({ ...newPermission, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
                placeholder="e.g., families.view"
                pattern="[a-z0-9_.]+"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Module *
                </label>
                <input
                  type="text"
                  value={newPermission.module}
                  onChange={e => setNewPermission({ ...newPermission, module: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  required
                  placeholder="e.g., families"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action *
                </label>
                <input
                  type="text"
                  value={newPermission.action}
                  onChange={e => setNewPermission({ ...newPermission, action: e.target.value.toLowerCase() })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  required
                  placeholder="e.g., view, create"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={newPermission.displayName}
                onChange={e => setNewPermission({ ...newPermission, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
                placeholder="e.g., View Families"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newPermission.description}
                onChange={e => setNewPermission({ ...newPermission, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                rows={2}
                placeholder="What does this permission allow?"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Create Permission
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false)
            setRoleToDelete(null)
          }}
          onConfirm={handleDelete}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${roleToDelete?.displayName}"? ${
            roleToDelete?.userCount && roleToDelete.userCount > 0
              ? `This role is assigned to ${roleToDelete.userCount} user(s). `
              : ''
          }This action cannot be undone.`}
          type="danger"
        />
      </div>
    </div>
  )
}
