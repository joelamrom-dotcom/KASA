'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

interface ReportField {
  fieldName: string
  label: string
  dataType: 'string' | 'number' | 'date' | 'currency' | 'boolean'
  aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'
  groupBy: boolean
  sortOrder: number
  format?: string
}

interface ReportFilter {
  fieldName: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  value2?: any
}

interface CustomReport {
  _id?: string
  name: string
  description?: string
  fields: ReportField[]
  filters: ReportFilter[]
  dateRange: {
    type: 'custom' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'last_30_days' | 'last_90_days' | 'last_365_days'
    startDate?: string
    endDate?: string
  }
  groupBy: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  comparison?: {
    enabled: boolean
    type: 'year_over_year' | 'period_over_period' | 'custom'
    compareToStartDate?: string
    compareToEndDate?: string
  }
  exportSettings: {
    includeSummary: boolean
    includeCharts: boolean
    pageOrientation: 'portrait' | 'landscape'
    pageSize: 'letter' | 'a4' | 'legal'
  }
}

const AVAILABLE_FIELDS = [
  { category: 'Payment', fields: [
    { fieldName: 'payment.amount', label: 'Payment Amount', dataType: 'currency' as const },
    { fieldName: 'payment.paymentDate', label: 'Payment Date', dataType: 'date' as const },
    { fieldName: 'payment.type', label: 'Payment Type', dataType: 'string' as const },
    { fieldName: 'payment.paymentMethod', label: 'Payment Method', dataType: 'string' as const },
    { fieldName: 'payment.family', label: 'Family Name', dataType: 'string' as const },
    { fieldName: 'payment.year', label: 'Year', dataType: 'number' as const },
  ]},
  { category: 'Family', fields: [
    { fieldName: 'family.name', label: 'Family Name', dataType: 'string' as const },
    { fieldName: 'family.email', label: 'Email', dataType: 'string' as const },
    { fieldName: 'family.phone', label: 'Phone', dataType: 'string' as const },
    { fieldName: 'family.city', label: 'City', dataType: 'string' as const },
  ]},
]

export default function CustomReportsPage() {
  const user = getUser()
  const [reports, setReports] = useState<CustomReport[]>([])
  const [scheduledReports, setScheduledReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showScheduledModal, setShowScheduledModal] = useState(false)
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'reports' | 'scheduled'>('reports')
  
  const [formData, setFormData] = useState<CustomReport>({
    name: '',
    description: '',
    fields: [],
    filters: [],
    dateRange: {
      type: 'this_year',
      startDate: '',
      endDate: ''
    },
    groupBy: [],
    sortBy: 'payment.paymentDate',
    sortOrder: 'desc',
    comparison: {
      enabled: false,
      type: 'year_over_year'
    },
    exportSettings: {
      includeSummary: true,
      includeCharts: true,
      pageOrientation: 'portrait',
      pageSize: 'letter'
    }
  })

  useEffect(() => {
    fetchReports()
    fetchScheduledReports()
  }, [])

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/custom', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScheduledReports = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/scheduled', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setScheduledReports(data)
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error)
    }
  }

  const addField = (field: any) => {
    setFormData({
      ...formData,
      fields: [...formData.fields, {
        fieldName: field.fieldName,
        label: field.label,
        dataType: field.dataType,
        aggregate: 'none',
        groupBy: false,
        sortOrder: formData.fields.length
      }]
    })
  }

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    })
  }

  const updateField = (index: number, updates: Partial<ReportField>) => {
    const newFields = [...formData.fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFormData({ ...formData, fields: newFields })
  }

  const saveReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          _id: editingReport?._id
        })
      })

      if (res.ok) {
        await fetchReports()
        setShowBuilder(false)
        setEditingReport(null)
        setFormData({
          name: '',
          description: '',
          fields: [],
          filters: [],
          dateRange: { type: 'this_year' },
          groupBy: [],
          sortBy: 'payment.paymentDate',
          sortOrder: 'desc',
          comparison: { enabled: false, type: 'year_over_year' },
          exportSettings: {
            includeSummary: true,
            includeCharts: true,
            pageOrientation: 'portrait',
            pageSize: 'letter'
          }
        })
        alert('Report saved successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to save report'}`)
      }
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Failed to save report')
    }
  }

  const generateReport = async (report: CustomReport) => {
    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/custom/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reportId: report._id })
      })

      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to generate report'}`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const exportReport = async (report: CustomReport, format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) {
      alert('Please generate the report first')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/custom/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportId: report._id,
          format,
          reportData
        })
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to export report'}`)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to export report')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/reports/custom?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        await fetchReports()
        alert('Report deleted successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to delete report'}`)
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report')
    }
  }

  const deleteScheduledReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/reports/scheduled?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        await fetchScheduledReports()
        alert('Scheduled report deleted successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to delete scheduled report'}`)
      }
    } catch (error) {
      console.error('Error deleting scheduled report:', error)
      alert('Failed to delete scheduled report')
    }
  }

  const saveScheduledReport = async (scheduledData: any) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(scheduledData)
      })

      if (res.ok) {
        await fetchScheduledReports()
        setShowScheduledModal(false)
        alert('Scheduled report saved successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to save scheduled report'}`)
      }
    } catch (error) {
      console.error('Error saving scheduled report:', error)
      alert('Failed to save scheduled report')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Custom Reports</h1>
            <p className="text-gray-600 mt-2">Create custom reports with drag-and-drop fields, filters, and comparisons</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScheduledModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <ClockIcon className="h-5 w-5" />
              Schedule Report
            </button>
            <button
              onClick={() => {
                setShowBuilder(true)
                setEditingReport(null)
                setFormData({
                  name: '',
                  description: '',
                  fields: [],
                  filters: [],
                  dateRange: { type: 'this_year' },
                  groupBy: [],
                  sortBy: 'payment.paymentDate',
                  sortOrder: 'desc',
                  comparison: { enabled: false, type: 'year_over_year' },
                  exportSettings: {
                    includeSummary: true,
                    includeCharts: true,
                    pageOrientation: 'portrait',
                    pageSize: 'letter'
                  }
                })
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 border-b-2 ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 border-b-2 ${activeTab === 'scheduled' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
            >
              Scheduled Reports
            </button>
          </div>
        </div>

        {/* Reports List */}
        {activeTab === 'reports' && (
          <div className="grid gap-4 mb-8">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800">{report.name}</h3>
                  {report.description && (
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  )}
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>{report.fields.length} fields</span>
                    <span>{report.filters.length} filters</span>
                    <span>Date range: {report.dateRange.type}</span>
                    {report.comparison?.enabled && <span>Comparison enabled</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateReport(report)}
                    disabled={generating}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => exportReport(report, 'pdf')}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    title="Export as PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => exportReport(report, 'excel')}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    title="Export as Excel"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => exportReport(report, 'csv')}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    title="Export as CSV"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => {
                      setEditingReport(report)
                      setFormData(report)
                      setShowBuilder(true)
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteReport(report._id!)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Scheduled Reports List */}
        {activeTab === 'scheduled' && (
          <div className="grid gap-4 mb-8">
            {scheduledReports.map((scheduled) => (
              <div key={scheduled._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">{scheduled.name}</h3>
                    <div className="mt-3 flex gap-4 text-sm text-gray-500">
                      <span>Frequency: {scheduled.schedule.frequency}</span>
                      <span>Format: {scheduled.exportFormat.toUpperCase()}</span>
                      <span>Recipients: {scheduled.recipients?.length || 0}</span>
                      {scheduled.nextRun && (
                        <span>Next run: {new Date(scheduled.nextRun).toLocaleString()}</span>
                      )}
                      {scheduled.lastRun && (
                        <span>Last run: {new Date(scheduled.lastRun).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Report: </span>
                      <span className="font-medium">{(scheduled.reportId as any)?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteScheduledReport(scheduled._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {scheduledReports.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No scheduled reports. Create one to automatically generate and email reports.</p>
              </div>
            )}
          </div>
        )}

        {/* Report Builder Modal */}
        {showBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">{editingReport ? 'Edit Report' : 'Create New Report'}</h2>
                <button
                  onClick={() => {
                    setShowBuilder(false)
                    setEditingReport(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium mb-2">Report Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="e.g., Monthly Payment Report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <select
                    value={formData.dateRange.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      dateRange: { ...formData.dateRange, type: e.target.value as any }
                    })}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="custom">Custom Range</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_year">This Year</option>
                    <option value="last_year">Last Year</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="last_365_days">Last 365 Days</option>
                  </select>
                  {formData.dateRange.type === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <input
                        type="date"
                        value={formData.dateRange.startDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, startDate: e.target.value }
                        })}
                        className="border rounded-lg px-4 py-2"
                      />
                      <input
                        type="date"
                        value={formData.dateRange.endDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, endDate: e.target.value }
                        })}
                        className="border rounded-lg px-4 py-2"
                      />
                    </div>
                  )}
                </div>

                {/* Available Fields */}
                <div>
                  <label className="block text-sm font-medium mb-2">Available Fields (Drag or Click to Add)</label>
                  <div className="border rounded-lg p-4 space-y-4">
                    {AVAILABLE_FIELDS.map((category) => (
                      <div key={category.category}>
                        <h4 className="font-semibold text-gray-700 mb-2">{category.category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {category.fields.map((field) => (
                            <button
                              key={field.fieldName}
                              onClick={() => addField(field)}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                            >
                              {field.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Fields */}
                <div>
                  <label className="block text-sm font-medium mb-2">Selected Fields</label>
                  {formData.fields.length === 0 ? (
                    <p className="text-gray-500 text-sm">No fields selected. Click fields above to add them.</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.fields.map((field, index) => (
                        <div key={index} className="border rounded-lg p-4 flex items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-gray-500">{field.fieldName}</div>
                          </div>
                          <select
                            value={field.aggregate}
                            onChange={(e) => updateField(index, { aggregate: e.target.value as any })}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="none">No Aggregation</option>
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="count">Count</option>
                            <option value="min">Min</option>
                            <option value="max">Max</option>
                          </select>
                          <button
                            onClick={() => removeField(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comparison */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.comparison?.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        comparison: { ...formData.comparison!, enabled: e.target.checked }
                      })}
                    />
                    <span className="font-medium">Enable Comparison</span>
                  </label>
                  {formData.comparison?.enabled && (
                    <select
                      value={formData.comparison.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        comparison: { ...formData.comparison!, type: e.target.value as any }
                      })}
                      className="mt-2 border rounded-lg px-4 py-2"
                    >
                      <option value="year_over_year">Year over Year</option>
                      <option value="period_over_period">Period over Period</option>
                      <option value="custom">Custom Period</option>
                    </select>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={saveReport}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Report
                  </button>
                  <button
                    onClick={() => {
                      setShowBuilder(false)
                      setEditingReport(null)
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Results */}
        {reportData && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Report Results</h2>
            {reportData.summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                {Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="font-medium">${typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                  </div>
                ))}
              </div>
            )}
            {reportData.data && reportData.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {reportData.fields.map((field: any) => (
                        <th key={field.fieldName} className="border px-4 py-2 text-left">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((row: any, index: number) => (
                      <tr key={index}>
                        {reportData.fields.map((field: any) => (
                          <td key={field.fieldName} className="border px-4 py-2">
                            {row[field.label] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Scheduled Report Modal */}
        {showScheduledModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Schedule Report</h2>
                <button
                  onClick={() => setShowScheduledModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <ScheduledReportForm
                reports={reports}
                onSave={saveScheduledReport}
                onCancel={() => setShowScheduledModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduledReportForm({ reports, onSave, onCancel }: { reports: CustomReport[], onSave: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    reportId: '',
    name: '',
    schedule: {
      frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
      dayOfWeek: 0,
      dayOfMonth: 1,
      time: '09:00'
    },
    recipients: [{ email: '', name: '' }],
    exportFormat: 'pdf' as 'pdf' | 'excel' | 'csv'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.reportId) {
      alert('Please select a report')
      return
    }
    if (formData.recipients.length === 0 || !formData.recipients[0].email) {
      alert('Please add at least one recipient email')
      return
    }
    onSave(formData)
  }

  const addRecipient = () => {
    setFormData({
      ...formData,
      recipients: [...formData.recipients, { email: '', name: '' }]
    })
  }

  const removeRecipient = (index: number) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Report *</label>
        <select
          value={formData.reportId}
          onChange={(e) => setFormData({ ...formData, reportId: e.target.value })}
          className="w-full border rounded-lg px-4 py-2"
          required
        >
          <option value="">Select a report</option>
          {reports.map((report) => (
            <option key={report._id} value={report._id}>{report.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Schedule Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded-lg px-4 py-2"
          placeholder="e.g., Monthly Payment Report"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Frequency *</label>
          <select
            value={formData.schedule.frequency}
            onChange={(e) => setFormData({
              ...formData,
              schedule: { ...formData.schedule, frequency: e.target.value as any }
            })}
            className="w-full border rounded-lg px-4 py-2"
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Time *</label>
          <input
            type="time"
            value={formData.schedule.time}
            onChange={(e) => setFormData({
              ...formData,
              schedule: { ...formData.schedule, time: e.target.value }
            })}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
        </div>
      </div>

      {formData.schedule.frequency === 'weekly' && (
        <div>
          <label className="block text-sm font-medium mb-2">Day of Week</label>
          <select
            value={formData.schedule.dayOfWeek}
            onChange={(e) => setFormData({
              ...formData,
              schedule: { ...formData.schedule, dayOfWeek: parseInt(e.target.value) }
            })}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
        </div>
      )}

      {(formData.schedule.frequency === 'monthly' || formData.schedule.frequency === 'quarterly' || formData.schedule.frequency === 'yearly') && (
        <div>
          <label className="block text-sm font-medium mb-2">Day of Month</label>
          <input
            type="number"
            min="1"
            max="31"
            value={formData.schedule.dayOfMonth}
            onChange={(e) => setFormData({
              ...formData,
              schedule: { ...formData.schedule, dayOfMonth: parseInt(e.target.value) }
            })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Export Format *</label>
        <select
          value={formData.exportFormat}
          onChange={(e) => setFormData({ ...formData, exportFormat: e.target.value as any })}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Recipients *</label>
          <button
            type="button"
            onClick={addRecipient}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Add Recipient
          </button>
        </div>
        {formData.recipients.map((recipient, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="email"
              value={recipient.email}
              onChange={(e) => {
                const newRecipients = [...formData.recipients]
                newRecipients[index].email = e.target.value
                setFormData({ ...formData, recipients: newRecipients })
              }}
              className="flex-1 border rounded-lg px-4 py-2"
              placeholder="email@example.com"
              required
            />
            <input
              type="text"
              value={recipient.name}
              onChange={(e) => {
                const newRecipients = [...formData.recipients]
                newRecipients[index].name = e.target.value
                setFormData({ ...formData, recipients: newRecipients })
              }}
              className="w-32 border rounded-lg px-4 py-2"
              placeholder="Name (optional)"
            />
            {formData.recipients.length > 1 && (
              <button
                type="button"
                onClick={() => removeRecipient(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Schedule
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

