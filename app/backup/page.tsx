'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function BackupPage() {
  const [backupType, setBackupType] = useState<'full' | 'families' | 'payments' | 'members'>('full')
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const handleBackup = async () => {
    try {
      setBackingUp(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ backupType })
      })

      if (res.ok) {
        const data = await res.json()
        // Download backup as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupType}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert(`Backup created: ${data.backup.recordCount} records`)
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('Failed to create backup')
    } finally {
      setBackingUp(false)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setRestoring(true)
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Restore logic would go here
      alert('Restore functionality - implementation pending')
    } catch (error) {
      console.error('Error restoring backup:', error)
      alert('Failed to restore backup')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Backup & Restore
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowDownTrayIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold">Create Backup</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Backup Type</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="full">Full Backup</option>
                  <option value="families">Families Only</option>
                  <option value="payments">Payments Only</option>
                  <option value="members">Members Only</option>
                </select>
              </div>
              <button
                onClick={handleBackup}
                disabled={backingUp}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                {backingUp ? 'Creating Backup...' : 'Create Backup'}
              </button>
            </div>
          </div>

          {/* Restore */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpTrayIcon className="h-8 w-8 text-green-600" />
              <h2 className="text-xl font-semibold">Restore Backup</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select a backup file to restore</p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  disabled={restoring}
                  className="hidden"
                />
                <div className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  {restoring ? 'Restoring...' : 'Select Backup File'}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Backup History */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold">Backup History</h2>
          </div>
          <p className="text-gray-500 text-center py-8">Backup history coming soon...</p>
        </div>
      </div>
    </div>
  )
}
