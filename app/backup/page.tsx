'use client'

import { useState, useEffect } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentArrowDownIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

interface Backup {
  _id: string
  backupType: string
  filename: string
  fileSize?: number
  recordCount?: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  error?: string
  createdAt: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupType, setBackupType] = useState('full')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/backup', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setBackups(data)
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ backupType, includeData: true })
      })

      if (res.ok) {
        const data = await res.json()
        setMessage({ type: 'success', text: 'Backup created successfully!' })
        
        // Download the backup file
        const blob = new Blob([data.data], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        
        fetchBackups()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to create backup' })
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      setMessage({ type: 'error', text: 'Failed to create backup' })
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv' = 'json', type: string = 'full') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/backup/export?format=${format}&type=${type}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const contentDisposition = res.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `export_${type}_${new Date().toISOString().split('T')[0]}.${format}`
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setMessage({ type: 'success', text: 'Export completed successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to export data' })
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      setMessage({ type: 'error', text: 'Failed to export data' })
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' })
      return
    }

    setImporting(true)
    try {
      const text = await importFile.text()
      const data = JSON.parse(text)

      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ data, validateOnly: false })
      })

      if (res.ok) {
        const result = await res.json()
        if (result.errors && result.errors.length > 0) {
          setMessage({ type: 'error', text: `Import completed with ${result.errors.length} errors. Check console for details.` })
          console.error('Import errors:', result.errors)
        } else {
          setMessage({ type: 'success', text: 'Import completed successfully!' })
        }
        setImportFile(null)
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to import data' })
      }
    } catch (error) {
      console.error('Error importing data:', error)
      setMessage({ type: 'error', text: 'Failed to import data. Please check file format.' })
    } finally {
      setImporting(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Backup & Restore
          </h1>
          <p className="text-gray-600">Backup and restore your data</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Create Backup */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Backup</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
              <select
                value={backupType}
                onChange={(e) => setBackupType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full">Full Backup</option>
                <option value="families">Families Only</option>
                <option value="payments">Payments Only</option>
                <option value="members">Members Only</option>
                <option value="events">Events Only</option>
              </select>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              {creatingBackup ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Export Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleExport('json', 'full')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv', 'full')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json', 'families')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export Families
            </button>
            <button
              onClick={() => handleExport('json', 'payments')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export Payments
            </button>
          </div>
        </div>

        {/* Import Data */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Import Data</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              {importing ? 'Importing...' : 'Import Data'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">⚠️ Importing will merge data. Make sure to backup first!</p>
        </div>

        {/* Backup History */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Backup History</h2>
          {backups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No backups found</div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {backup.status === 'completed' ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : backup.status === 'failed' ? (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    ) : (
                      <ClockIcon className="h-6 w-6 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{backup.filename}</p>
                      <p className="text-sm text-gray-600">
                        {backup.backupType} • {backup.recordCount || 0} records • {formatFileSize(backup.fileSize)} • {new Date(backup.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                      backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                      backup.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {backup.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

