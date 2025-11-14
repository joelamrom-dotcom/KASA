'use client'

import { useState, useEffect } from 'react'
import { 
  TrashIcon, 
  ArrowPathIcon, 
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface RecycleBinItem {
  _id: string
  recordType: string
  originalId: string
  recordData: any
  deletedBy?: string
  deletedAt: string
  restoredAt?: string
  restoredBy?: string
  createdAt: string
  updatedAt: string
}

export default function RecycleBinPage() {
  const [items, setItems] = useState<RecycleBinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<RecycleBinItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchRecycleBin()
  }, [filterType])

  const fetchRecycleBin = async () => {
    setLoading(true)
    try {
      const url = filterType === 'all' 
        ? '/api/kasa/recycle-bin'
        : `/api/kasa/recycle-bin?type=${filterType}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setItems(data || [])
      }
    } catch (error) {
      console.error('Error fetching recycle bin:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (itemId: string) => {
    if (!confirm('Are you sure you want to restore this record?')) return

    try {
      const res = await fetch(`/api/kasa/recycle-bin/${itemId}`, {
        method: 'POST'
      })
      if (res.ok) {
        alert('Record restored successfully')
        fetchRecycleBin()
      } else {
        const errorData = await res.json()
        alert(`Error restoring record: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error restoring record:', error)
      alert('Error restoring record. Please try again.')
    }
  }

  const handlePermanentDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone!')) return

    try {
      const res = await fetch(`/api/kasa/recycle-bin/${itemId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('Record permanently deleted')
        fetchRecycleBin()
      } else {
        const errorData = await res.json()
        alert(`Error deleting record: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error permanently deleting record:', error)
      alert('Error deleting record. Please try again.')
    }
  }

  const getRecordDisplayName = (item: RecycleBinItem): string => {
    const data = item.recordData
    switch (item.recordType) {
      case 'family':
        return data.name || `Family (${item.originalId})`
      case 'member':
        return `${data.firstName || ''} ${data.lastName || ''}`.trim() || `Member (${item.originalId})`
      case 'payment':
        return `Payment: $${data.amount || 0} - ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString() : 'N/A'}`
      case 'withdrawal':
        return `Withdrawal: $${data.amount || 0} - ${data.withdrawalDate ? new Date(data.withdrawalDate).toLocaleDateString() : 'N/A'}`
      case 'lifecycleEvent':
        return `${data.eventType || 'Event'} - ${data.eventDate ? new Date(data.eventDate).toLocaleDateString() : 'N/A'}`
      case 'note':
        return data.note ? (data.note.length > 50 ? data.note.substring(0, 50) + '...' : data.note) : `Note (${item.originalId})`
      case 'task':
        return data.title || `Task (${item.originalId})`
      case 'statement':
        return `Statement ${data.statementNumber || item.originalId}`
      case 'paymentPlan':
        return data.name || `Payment Plan (${item.originalId})`
      default:
        return `${item.recordType} (${item.originalId})`
    }
  }

  const recordTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'family', label: 'Families' },
    { value: 'member', label: 'Members' },
    { value: 'payment', label: 'Payments' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'lifecycleEvent', label: 'Lifecycle Events' },
    { value: 'note', label: 'Notes' },
    { value: 'task', label: 'Tasks' },
    { value: 'statement', label: 'Statements' },
    { value: 'paymentPlan', label: 'Payment Plans' }
  ]

  return (
    <div className="ml-64 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recycle Bin</h1>
          <p className="text-gray-600">View and manage deleted records</p>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {recordTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-gray-500 mt-4">Loading recycle bin...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <TrashIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Recycle bin is empty</p>
            <p className="text-sm text-gray-500">
              Deleted records will appear here and can be restored or permanently deleted.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deleted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deleted By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                          {item.recordType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getRecordDisplayName(item)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(item.deletedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.deletedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.deletedBy || 'System'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDetailsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(item._id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Restore"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(item._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Permanently delete"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Record Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type:</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedItem.recordType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Original ID:</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedItem.originalId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Deleted At:</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedItem.deletedAt).toLocaleString()}
                  </p>
                </div>
                {selectedItem.deletedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Deleted By:</label>
                    <p className="text-sm text-gray-900">{selectedItem.deletedBy}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Record Data:</label>
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto mt-2">
                    {JSON.stringify(selectedItem.recordData, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedItem(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRestore(selectedItem._id)
                    setShowDetailsModal(false)
                    setSelectedItem(null)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Restore
                </button>
                <button
                  onClick={() => {
                    handlePermanentDelete(selectedItem._id)
                    setShowDetailsModal(false)
                    setSelectedItem(null)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Permanent Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

