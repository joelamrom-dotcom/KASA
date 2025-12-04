'use client'

import { useState, useEffect } from 'react'
import { ShareIcon, XMarkIcon, LinkIcon, UserGroupIcon, UserIcon, TrashIcon, EyeIcon, PencilIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface Share {
  _id: string
  shareType: 'user' | 'role' | 'public' | 'link'
  sharedWith?: { firstName: string; lastName: string; email: string }
  roleId?: { name: string; displayName: string }
  permissions: {
    view: boolean
    edit: boolean
    share: boolean
    delete: boolean
    export: boolean
    schedule: boolean
    comment: boolean
  }
  shareLink?: {
    token: string
    expiresAt?: string
    accessCount: number
    maxAccessCount?: number
    password?: string
  }
  createdAt: string
}

interface AdvancedReportSharingProps {
  reportId: string
  onClose: () => void
}

export default function AdvancedReportSharing({ reportId, onClose }: AdvancedReportSharingProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareForm, setShowShareForm] = useState(false)
  const [shareType, setShareType] = useState<'user' | 'role' | 'link'>('user')
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [permissions, setPermissions] = useState({
    view: true,
    edit: false,
    share: false,
    delete: false,
    export: true,
    schedule: false,
    comment: true,
  })
  const [linkOptions, setLinkOptions] = useState({
    expiresAt: '',
    password: '',
    maxAccessCount: '',
  })
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    fetchShares()
    fetchUsers()
    fetchRoles()
  }, [reportId])

  const fetchShares = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/shares`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setShares(data.shares || [])
      }
    } catch (error) {
      console.error('Error fetching shares:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/roles', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleShare = async () => {
    try {
      const token = localStorage.getItem('token')
      const body: any = {
        shareType,
        permissions,
      }

      if (shareType === 'user') {
        if (!selectedUser) {
          alert('Please select a user')
          return
        }
        body.sharedWith = selectedUser
      } else if (shareType === 'role') {
        if (!selectedRole) {
          alert('Please select a role')
          return
        }
        body.roleId = selectedRole
      } else if (shareType === 'link') {
        body.linkOptions = {
          expiresAt: linkOptions.expiresAt || undefined,
          password: linkOptions.password || undefined,
          maxAccessCount: linkOptions.maxAccessCount ? parseInt(linkOptions.maxAccessCount) : undefined,
        }
      }

      const res = await fetch(`/api/reports/${reportId}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.shareUrl) {
          setShareUrl(data.shareUrl)
          alert(`Share link created: ${data.shareUrl}`)
        }
        fetchShares()
        setShowShareForm(false)
        setShareUrl('')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to share report'}`)
      }
    } catch (error) {
      console.error('Error sharing report:', error)
      alert('Failed to share report')
    }
  }

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this share?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/shares?shareId=${shareId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })

      if (res.ok) {
        fetchShares()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to revoke share'}`)
      }
    } catch (error) {
      console.error('Error revoking share:', error)
      alert('Failed to revoke share')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <ShareIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Advanced Sharing</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Share Form */}
          {showShareForm ? (
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-4">Share Report</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Share Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShareType('user')}
                      className={`px-4 py-2 rounded ${
                        shareType === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      User
                    </button>
                    <button
                      onClick={() => setShareType('role')}
                      className={`px-4 py-2 rounded ${
                        shareType === 'role'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <UserGroupIcon className="h-4 w-4 inline mr-1" />
                      Role
                    </button>
                    <button
                      onClick={() => setShareType('link')}
                      className={`px-4 py-2 rounded ${
                        shareType === 'link'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-1" />
                      Link
                    </button>
                  </div>
                </div>

                {shareType === 'user' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select User</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shareType === 'role' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select a role...</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.displayName || role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shareType === 'link' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiration Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={linkOptions.expiresAt}
                        onChange={(e) => setLinkOptions({ ...linkOptions, expiresAt: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password (optional)</label>
                      <input
                        type="password"
                        value={linkOptions.password}
                        onChange={(e) => setLinkOptions({ ...linkOptions, password: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Access Count (optional)</label>
                      <input
                        type="number"
                        value={linkOptions.maxAccessCount}
                        onChange={(e) => setLinkOptions({ ...linkOptions, maxAccessCount: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Unlimited if empty"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(permissions).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                        />
                        <span className="text-sm capitalize">{key}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      setShowShareForm(false)
                      setShareUrl('')
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowShareForm(true)}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Share Report
            </button>
          )}

          {/* Shares List */}
          {loading ? (
            <div className="text-center py-8">Loading shares...</div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No shares configured.</p>
              <p className="text-sm mt-2">Click "Share Report" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div key={share._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {share.shareType === 'user' && <UserIcon className="h-5 w-5 text-blue-600" />}
                        {share.shareType === 'role' && <UserGroupIcon className="h-5 w-5 text-purple-600" />}
                        {share.shareType === 'link' && <LinkIcon className="h-5 w-5 text-green-600" />}
                        <span className="font-medium capitalize">{share.shareType}</span>
                        {share.shareLink?.password && (
                          <LockClosedIcon className="h-4 w-4 text-gray-500" title="Password protected" />
                        )}
                      </div>
                      
                      {share.sharedWith && (
                        <div className="text-sm text-gray-600">
                          {share.sharedWith.firstName} {share.sharedWith.lastName} ({share.sharedWith.email})
                        </div>
                      )}
                      
                      {share.roleId && (
                        <div className="text-sm text-gray-600">
                          Role: {share.roleId.displayName || share.roleId.name}
                        </div>
                      )}
                      
                      {share.shareLink && (
                        <div className="text-sm text-gray-600 mt-2">
                          <div>Access Count: {share.shareLink.accessCount}</div>
                          {share.shareLink.expiresAt && (
                            <div>Expires: {new Date(share.shareLink.expiresAt).toLocaleString()}</div>
                          )}
                          {share.shareLink.maxAccessCount && (
                            <div>Max Accesses: {share.shareLink.maxAccessCount}</div>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(share.permissions).map(([key, value]) => (
                          value && (
                            <span
                              key={key}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                            >
                              {key}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(share._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Revoke share"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

