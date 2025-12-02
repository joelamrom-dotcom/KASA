'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline'

export default function AdvancedExportPage() {
  const [exportConfig, setExportConfig] = useState({
    entityType: 'families',
    format: 'csv' as 'csv' | 'excel' | 'json' | 'xml',
    fields: [] as string[],
    filters: {} as any,
    schedule: false,
    scheduleFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    scheduleTime: '09:00'
  })

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/export/${exportConfig.entityType}?format=${exportConfig.format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fields: exportConfig.fields,
          filters: exportConfig.filters
        })
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export-${exportConfig.entityType}-${new Date().toISOString()}.${exportConfig.format}`
        a.click()
      }
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Advanced Export
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Entity Type</label>
            <select
              value={exportConfig.entityType}
              onChange={(e) => setExportConfig({ ...exportConfig, entityType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="families">Families</option>
              <option value="payments">Payments</option>
              <option value="members">Members</option>
              <option value="invoices">Invoices</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="grid grid-cols-4 gap-2">
              {['csv', 'excel', 'json', 'xml'].map(format => (
                <button
                  key={format}
                  onClick={() => setExportConfig({ ...exportConfig, format: format as any })}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    exportConfig.format === format ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Schedule Export (optional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportConfig.schedule}
                  onChange={(e) => setExportConfig({ ...exportConfig, schedule: e.target.checked })}
                />
                <span>Enable scheduled export</span>
              </label>
              {exportConfig.schedule && (
                <>
                  <select
                    value={exportConfig.scheduleFrequency}
                    onChange={(e) => setExportConfig({ ...exportConfig, scheduleFrequency: e.target.value as any })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                    type="time"
                    value={exportConfig.scheduleTime}
                    onChange={(e) => setExportConfig({ ...exportConfig, scheduleTime: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

