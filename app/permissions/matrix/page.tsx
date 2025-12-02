'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function PermissionMatrixPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
        fetch('/api/permissions', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      ])

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRoles(rolesData.roles || [])
      }

      if (permsRes.ok) {
        const permsData = await permsRes.json()
        setPermissions(permsData.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (roleId: string, permissionId: string, value: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          roleId,
          permissionId,
          granted: value
        })
      })
      if (res.ok) {
        setMatrix(prev => ({
          ...prev,
          [roleId]: {
            ...prev[roleId],
            [permissionId]: value
          }
        }))
      }
    } catch (error) {
      console.error('Error updating permission:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading permission matrix...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Permission Matrix
        </h1>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  Permission
                </th>
                {roles.map(role => (
                  <th key={role._id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map(permission => (
                <tr key={permission._id}>
                  <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-white z-10">
                    {permission.name}
                  </td>
                  {roles.map(role => (
                    <td key={role._id} className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePermission(
                          role._id,
                          permission._id,
                          !matrix[role._id]?.[permission._id]
                        )}
                        className={`p-2 rounded ${
                          matrix[role._id]?.[permission._id]
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {matrix[role._id]?.[permission._id] ? (
                          <CheckIcon className="h-5 w-5" />
                        ) : (
                          <XMarkIcon className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

