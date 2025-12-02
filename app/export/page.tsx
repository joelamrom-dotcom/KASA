'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon, CalendarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

export default function ExportPage() {
  const [exportType, setExportType] = useState<'payments' | 'families' | 'members'>('payments')
  const [format, setFormat] = useState<'csv' | 'excel'>('csv')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    year: ''
  })
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      const token = localStorage.getItem('token')
      let url = `/api/kasa/export/${exportType}?format=${format}`
      
      if (filters.startDate) url += `&startDate=${filters.startDate}`
      if (filters.endDate) url += `&endDate=${filters.endDate}`
      if (filters.year) url += `&year=${filters.year}`

      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        if (format === 'csv') {
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${exportType}-export-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await res.json()
          // Handle Excel export (would need additional processing)
          alert(`Export ready: ${data.count} records`)
        }
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Export Data
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Export Type</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="payments">Payments</option>
              <option value="families">Families</option>
              <option value="members">Members</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., 2024"
              />
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>
    </div>
  )
}

