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
  XMarkIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  StarIcon,
  FunnelIcon,
  CalculatorIcon,
  ShareIcon,
  TagIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  ClockIcon as ClockIconSolid,
  UserGroupIcon,
  CameraIcon,
  ArrowDownIcon,
  ChartPieIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface ReportField {
  fieldName: string
  label: string
  dataType: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'calculated'
  aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'
  groupBy: boolean
  sortOrder: number
  format?: string
  formula?: string // For calculated fields
}

interface ReportFilter {
  fieldName: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than_or_equal' | 'less_than_or_equal'
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
    type: 'custom' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'last_30_days' | 'last_90_days' | 'last_365_days' | 'this_quarter' | 'last_quarter' | 'this_fiscal_year' | 'last_fiscal_year' | 'ytd' | 'mtd' | 'qtd'
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
  chartSettings?: {
    enabled: boolean
    chartType: 'bar' | 'line' | 'pie' | 'area' | 'column'
    xAxisField?: string
    yAxisField?: string
    showLegend: boolean
    showDataLabels: boolean
  }
  conditionalFormatting?: {
    enabled: boolean
    rules: Array<{
      field: string
      operator: 'greater_than' | 'less_than' | 'equals' | 'between'
      value: any
      value2?: any
      backgroundColor?: string
      textColor?: string
      bold?: boolean
    }>
  }
  emailSettings?: {
    enabled: boolean
    recipients: string[]
    subject?: string
    includeData: boolean
    includeCharts: boolean
  }
  sharedWith?: string[] // User IDs who can view this report
  tags?: string[] // Tags for categorization
  notes?: string // Report notes/comments
  createdAt?: string
  updatedAt?: string
  version?: number
}

const AVAILABLE_FIELDS = [
  { category: 'Payment', fields: [
    { fieldName: 'payment.amount', label: 'Payment Amount', dataType: 'currency' as const },
    { fieldName: 'payment.paymentDate', label: 'Payment Date', dataType: 'date' as const },
    { fieldName: 'payment.type', label: 'Payment Type', dataType: 'string' as const },
    { fieldName: 'payment.paymentMethod', label: 'Payment Method', dataType: 'string' as const },
    { fieldName: 'payment.year', label: 'Year', dataType: 'number' as const },
    { fieldName: 'payment.notes', label: 'Payment Notes', dataType: 'string' as const },
    { fieldName: 'payment.refundedAmount', label: 'Refunded Amount', dataType: 'currency' as const },
    { fieldName: 'payment.isFullyRefunded', label: 'Fully Refunded', dataType: 'boolean' as const },
    { fieldName: 'payment.paymentFrequency', label: 'Payment Frequency', dataType: 'string' as const },
  ]},
  { category: 'Family', fields: [
    { fieldName: 'family.name', label: 'Family Name', dataType: 'string' as const },
    { fieldName: 'family.hebrewName', label: 'Hebrew Name', dataType: 'string' as const },
    { fieldName: 'family.weddingDate', label: 'Wedding Date', dataType: 'date' as const },
    { fieldName: 'family.email', label: 'Email', dataType: 'string' as const },
    { fieldName: 'family.phone', label: 'Phone', dataType: 'string' as const },
    { fieldName: 'family.husbandCellPhone', label: 'Husband Cell Phone', dataType: 'string' as const },
    { fieldName: 'family.wifeCellPhone', label: 'Wife Cell Phone', dataType: 'string' as const },
    { fieldName: 'family.address', label: 'Address', dataType: 'string' as const },
    { fieldName: 'family.street', label: 'Street', dataType: 'string' as const },
    { fieldName: 'family.city', label: 'City', dataType: 'string' as const },
    { fieldName: 'family.state', label: 'State', dataType: 'string' as const },
    { fieldName: 'family.zip', label: 'ZIP Code', dataType: 'string' as const },
    { fieldName: 'family.husbandFirstName', label: 'Husband First Name', dataType: 'string' as const },
    { fieldName: 'family.husbandHebrewName', label: 'Husband Hebrew Name', dataType: 'string' as const },
    { fieldName: 'family.wifeFirstName', label: 'Wife First Name', dataType: 'string' as const },
    { fieldName: 'family.wifeHebrewName', label: 'Wife Hebrew Name', dataType: 'string' as const },
    { fieldName: 'family.openBalance', label: 'Open Balance', dataType: 'currency' as const },
    { fieldName: 'family.receiveEmails', label: 'Receives Emails', dataType: 'boolean' as const },
    { fieldName: 'family.receiveSMS', label: 'Receives SMS', dataType: 'boolean' as const },
  ]},
  { category: 'Member', fields: [
    { fieldName: 'member.firstName', label: 'First Name', dataType: 'string' as const },
    { fieldName: 'member.hebrewFirstName', label: 'Hebrew First Name', dataType: 'string' as const },
    { fieldName: 'member.lastName', label: 'Last Name', dataType: 'string' as const },
    { fieldName: 'member.hebrewLastName', label: 'Hebrew Last Name', dataType: 'string' as const },
    { fieldName: 'member.birthDate', label: 'Birth Date', dataType: 'date' as const },
    { fieldName: 'member.hebrewBirthDate', label: 'Hebrew Birth Date', dataType: 'string' as const },
    { fieldName: 'member.gender', label: 'Gender', dataType: 'string' as const },
    { fieldName: 'member.barMitzvahDate', label: 'Bar Mitzvah Date', dataType: 'date' as const },
    { fieldName: 'member.batMitzvahDate', label: 'Bat Mitzvah Date', dataType: 'date' as const },
    { fieldName: 'member.weddingDate', label: 'Wedding Date', dataType: 'date' as const },
    { fieldName: 'member.phone', label: 'Phone', dataType: 'string' as const },
    { fieldName: 'member.email', label: 'Email', dataType: 'string' as const },
    { fieldName: 'member.address', label: 'Address', dataType: 'string' as const },
    { fieldName: 'member.city', label: 'City', dataType: 'string' as const },
    { fieldName: 'member.state', label: 'State', dataType: 'string' as const },
    { fieldName: 'member.zip', label: 'ZIP Code', dataType: 'string' as const },
  ]},
  { category: 'Lifecycle Event', fields: [
    { fieldName: 'event.eventType', label: 'Event Type', dataType: 'string' as const },
    { fieldName: 'event.eventDate', label: 'Event Date', dataType: 'date' as const },
    { fieldName: 'event.amount', label: 'Event Amount', dataType: 'currency' as const },
    { fieldName: 'event.year', label: 'Year', dataType: 'number' as const },
    { fieldName: 'event.notes', label: 'Event Notes', dataType: 'string' as const },
  ]},
  { category: 'Withdrawal', fields: [
    { fieldName: 'withdrawal.amount', label: 'Withdrawal Amount', dataType: 'currency' as const },
    { fieldName: 'withdrawal.withdrawalDate', label: 'Withdrawal Date', dataType: 'date' as const },
    { fieldName: 'withdrawal.reason', label: 'Reason', dataType: 'string' as const },
    { fieldName: 'withdrawal.notes', label: 'Notes', dataType: 'string' as const },
  ]},
  { category: 'Statement', fields: [
    { fieldName: 'statement.statementDate', label: 'Statement Date', dataType: 'date' as const },
    { fieldName: 'statement.startDate', label: 'Start Date', dataType: 'date' as const },
    { fieldName: 'statement.endDate', label: 'End Date', dataType: 'date' as const },
    { fieldName: 'statement.totalCharges', label: 'Total Charges', dataType: 'currency' as const },
    { fieldName: 'statement.totalPayments', label: 'Total Payments', dataType: 'currency' as const },
    { fieldName: 'statement.balance', label: 'Balance', dataType: 'currency' as const },
    { fieldName: 'statement.status', label: 'Status', dataType: 'string' as const },
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
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [emailReport, setEmailReport] = useState<CustomReport | null>(null)
  const [favoriteReports, setFavoriteReports] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [users, setUsers] = useState<any[]>([])
  const [shareReport, setShareReport] = useState<CustomReport | null>(null)
  const [reportSnapshots, setReportSnapshots] = useState<Record<string, any[]>>({})
  const [showSnapshots, setShowSnapshots] = useState<string | null>(null)
  
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
    },
    chartSettings: {
      enabled: false,
      chartType: 'bar',
      showLegend: true,
      showDataLabels: false
    }
  })

  useEffect(() => {
    fetchReports()
    fetchScheduledReports()
    // Load favorite reports from localStorage
    const favorites = localStorage.getItem('favoriteReports')
    if (favorites) {
      setFavoriteReports(JSON.parse(favorites))
    }
  }, [])

  // Report Templates/Presets
  const REPORT_TEMPLATES = [
    {
      name: 'Monthly Payment Summary',
      description: 'Summary of all payments for the current month',
      fields: [
        { fieldName: 'payment.amount', label: 'Payment Amount', dataType: 'currency' as const, aggregate: 'sum' as const, groupBy: false, sortOrder: 0 },
        { fieldName: 'payment.paymentDate', label: 'Payment Date', dataType: 'date' as const, aggregate: 'none' as const, groupBy: true, sortOrder: 1 },
        { fieldName: 'family.name', label: 'Family Name', dataType: 'string' as const, aggregate: 'none' as const, groupBy: false, sortOrder: 2 }
      ],
      filters: [],
      dateRange: { type: 'this_month' as const },
      groupBy: ['payment.paymentDate'],
      sortBy: 'payment.paymentDate',
      sortOrder: 'desc' as const
    },
    {
      name: 'Overdue Payments Report',
      description: 'Families with overdue balances',
      fields: [
        { fieldName: 'family.name', label: 'Family Name', dataType: 'string' as const, aggregate: 'none' as const, groupBy: false, sortOrder: 0 },
        { fieldName: 'family.openBalance', label: 'Open Balance', dataType: 'currency' as const, aggregate: 'none' as const, groupBy: false, sortOrder: 1 },
        { fieldName: 'family.email', label: 'Email', dataType: 'string' as const, aggregate: 'none' as const, groupBy: false, sortOrder: 2 }
      ],
      filters: [
        { fieldName: 'family.openBalance', operator: 'greater_than' as const, value: 0 }
      ],
      dateRange: { type: 'custom' as const },
      groupBy: [],
      sortBy: 'family.openBalance',
      sortOrder: 'desc' as const
    },
    {
      name: 'Payment Method Breakdown',
      description: 'Payments grouped by payment method',
      fields: [
        { fieldName: 'payment.paymentMethod', label: 'Payment Method', dataType: 'string' as const, aggregate: 'none' as const, groupBy: true, sortOrder: 0 },
        { fieldName: 'payment.amount', label: 'Total Amount', dataType: 'currency' as const, aggregate: 'sum' as const, groupBy: false, sortOrder: 1 },
        { fieldName: 'payment.amount', label: 'Count', dataType: 'number' as const, aggregate: 'count' as const, groupBy: false, sortOrder: 2 }
      ],
      filters: [],
      dateRange: { type: 'this_year' as const },
      groupBy: ['payment.paymentMethod'],
      sortBy: 'payment.amount',
      sortOrder: 'desc' as const
    }
  ]

  const duplicateReport = async (report: CustomReport) => {
    try {
      const token = localStorage.getItem('token')
      const duplicateData = {
        ...report,
        name: `${report.name} (Copy)`,
        _id: undefined
      }
      
      const res = await fetch('/api/kasa/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(duplicateData)
      })

      if (res.ok) {
        await fetchReports()
        alert('Report duplicated successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to duplicate report'}`)
      }
    } catch (error) {
      console.error('Error duplicating report:', error)
      alert('Failed to duplicate report')
    }
  }

  const toggleFavorite = (reportId: string) => {
    const newFavorites = favoriteReports.includes(reportId)
      ? favoriteReports.filter(id => id !== reportId)
      : [...favoriteReports, reportId]
    setFavoriteReports(newFavorites)
    localStorage.setItem('favoriteReports', JSON.stringify(newFavorites))
  }

  const sendReportEmail = async (report: CustomReport, recipients: string[], subject: string, message: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const token = localStorage.getItem('token')
      if (!reportData) {
        alert('Please generate the report first')
        return
      }

      const res = await fetch('/api/kasa/reports/custom/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportId: report._id,
          recipients,
          subject,
          message,
          format,
          reportData
        })
      })

      if (res.ok) {
        setShowEmailModal(false)
        setEmailReport(null)
        alert('Report sent successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to send report'}`)
      }
    } catch (error) {
      console.error('Error sending report:', error)
      alert('Failed to send report')
    }
  }

  const createReportSnapshot = async (report: CustomReport) => {
    try {
      if (!reportData) {
        alert('Please generate the report first')
        return
      }

      const snapshot = {
        reportId: report._id,
        reportName: report.name,
        reportData: reportData,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'Unknown'
      }

      // Store snapshot in localStorage (could be moved to backend)
      const snapshots = JSON.parse(localStorage.getItem(`reportSnapshots_${report._id}`) || '[]')
      snapshots.unshift(snapshot)
      if (snapshots.length > 10) snapshots.pop() // Keep only last 10
      localStorage.setItem(`reportSnapshots_${report._id}`, JSON.stringify(snapshots))
      
      setReportSnapshots(prev => ({
        ...prev,
        [report._id || '']: snapshots
      }))

      alert('Report snapshot created successfully!')
    } catch (error) {
      console.error('Error creating snapshot:', error)
      alert('Failed to create snapshot')
    }
  }

  const loadReportSnapshot = (reportId: string, snapshot: any) => {
    setReportData(snapshot.reportData)
    setEditingReport(reports.find(r => r._id === reportId) || null)
    alert(`Loaded snapshot from ${new Date(snapshot.createdAt).toLocaleString()}`)
  }

  const shareReportWithUsers = async (report: CustomReport, userIds: string[], permission: 'view' | 'edit') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/reports/custom/${report._id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userIds,
          permission
        })
      })

      if (res.ok) {
        await fetchReports()
        setShowShareModal(false)
        setShareReport(null)
        alert('Report shared successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to share report'}`)
      }
    } catch (error) {
      console.error('Error sharing report:', error)
      alert('Failed to share report')
    }
  }

  const exportReportAsJSON = async (report: CustomReport) => {
    if (!reportData) {
      alert('Please generate the report first')
      return
    }

    const jsonData = {
      report: {
        name: report.name,
        description: report.description,
        fields: report.fields,
        filters: report.filters,
        dateRange: report.dateRange,
        groupBy: report.groupBy,
        sortBy: report.sortBy,
        sortOrder: report.sortOrder
      },
      data: reportData,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

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
    // Validation
    if (!formData.name || formData.name.trim() === '') {
      alert('Please enter a report name')
      return
    }

    if (!formData.fields || formData.fields.length === 0) {
      alert('Please select at least one field for the report')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description || '',
          fields: formData.fields || [],
          filters: formData.filters || [],
          dateRange: formData.dateRange || { type: 'this_year' },
          groupBy: formData.groupBy || [],
          sortBy: formData.sortBy || 'payment.paymentDate',
          sortOrder: formData.sortOrder || 'desc',
          comparison: formData.comparison || { enabled: false, type: 'year_over_year' },
          exportSettings: formData.exportSettings || {
            includeSummary: true,
            includeCharts: true,
            pageOrientation: 'portrait',
            pageSize: 'letter'
          },
          chartSettings: formData.chartSettings || {
            enabled: false,
            chartType: 'bar',
            showLegend: true,
            showDataLabels: false
          },
          _id: editingReport?._id
        })
      })

      if (res.ok) {
        const savedReport = await res.json()
        await fetchReports()
        
        // Auto-generate the report after saving
        setGenerating(true)
        try {
          const generateRes = await fetch('/api/kasa/reports/custom/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              reportId: savedReport._id
            })
          })

          if (generateRes.ok) {
            const reportData = await generateRes.json()
            setReportData(reportData)
            setEditingReport(savedReport)
            alert('Report saved and generated successfully!')
          } else {
            const error = await generateRes.json().catch(() => ({ error: 'Failed to generate report' }))
            console.warn('Report saved but generation failed:', error)
            alert('Report saved successfully, but failed to generate. You can generate it manually.')
          }
        } catch (genError) {
          console.error('Error auto-generating report:', genError)
          alert('Report saved successfully, but failed to generate. You can generate it manually.')
        } finally {
          setGenerating(false)
        }
        
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
          },
          chartSettings: {
            enabled: false,
            chartType: 'bar',
            showLegend: true,
            showDataLabels: false
          }
        })
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Save error response:', errorData)
        alert(`Error: ${errorData.error || errorData.details || 'Failed to save report'}`)
      }
    } catch (error: any) {
      console.error('Error saving report:', error)
      alert(`Failed to save report: ${error.message || 'Unknown error'}`)
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
        if (format === 'pdf') {
          // Handle PDF export with client-side generation
          const data = await res.json()
          if (data.html) {
            // Use html2pdf.js for client-side PDF generation
            const html2pdf = (await import('html2pdf.js')).default
            
            // Create a temporary element with the HTML content
            const element = document.createElement('div')
            element.innerHTML = data.html
            element.style.position = 'absolute'
            element.style.left = '-9999px'
            document.body.appendChild(element)
            
            const opt = {
              margin: [10, 10, 10, 10] as [number, number, number, number],
              filename: data.filename,
              image: { type: 'jpeg' as const, quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { 
                unit: 'mm', 
                format: data.pageSize === 'a4' ? 'a4' : 'letter', 
                orientation: data.orientation || 'portrait' as const 
              }
            }
            
            try {
              await html2pdf().set(opt).from(element).save()
            } finally {
              document.body.removeChild(element)
            }
          } else {
            // Fallback: download as blob if server returned PDF directly
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = data.filename || `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          }
        } else {
          // Handle Excel and CSV exports
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to export report'}`)
      }
    } catch (error: any) {
      console.error('Error exporting report:', error)
      alert(`Failed to export report: ${error.message || 'Unknown error'}`)
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
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
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
                  },
                  chartSettings: {
                    enabled: false,
                    chartType: 'bar',
                    showLegend: true,
                    showDataLabels: false
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

        {/* Report Templates */}
        {activeTab === 'reports' && reports.length === 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Start Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {REPORT_TEMPLATES.map((template, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-4 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors">
                  <h3 className="font-semibold text-gray-800 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <button
                    onClick={() => {
                      setFormData({
                        ...template,
                        exportSettings: {
                          includeSummary: true,
                          includeCharts: true,
                          pageOrientation: 'portrait',
                          pageSize: 'letter'
                        },
                        chartSettings: {
                          enabled: false,
                          chartType: 'bar',
                          showLegend: true,
                          showDataLabels: false
                        }
                      } as CustomReport)
                      setShowBuilder(true)
                      setEditingReport(null)
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports List */}
        {activeTab === 'reports' && (
          <div className="grid gap-4 mb-8">
          {reports
            .sort((a, b) => {
              const aFav = favoriteReports.includes(a._id || '')
              const bFav = favoriteReports.includes(b._id || '')
              if (aFav && !bFav) return -1
              if (!aFav && bFav) return 1
              return 0
            })
            .map((report) => (
            <div 
              key={report._id} 
              className={`bg-white rounded-lg shadow p-6 border-2 ${selectedReports.includes(report._id || '') ? 'border-blue-500' : favoriteReports.includes(report._id || '') ? 'ring-2 ring-yellow-400' : 'border-transparent'} ${selectedReports.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => {
                if (selectedReports.length > 0) {
                  setSelectedReports(prev => 
                    prev.includes(report._id || '') 
                      ? prev.filter(id => id !== report._id)
                      : [...prev, report._id || '']
                  )
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {selectedReports.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id || '')}
                        onChange={(e) => {
                          e.stopPropagation()
                          setSelectedReports(prev => 
                            prev.includes(report._id || '') 
                              ? prev.filter(id => id !== report._id)
                              : [...prev, report._id || '']
                          )
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(report._id!)
                      }}
                      className={`p-1 rounded ${favoriteReports.includes(report._id || '') ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                    >
                      <StarIcon className={`h-5 w-5 ${favoriteReports.includes(report._id || '') ? 'fill-current' : ''}`} />
                    </button>
                    <h3 className="text-xl font-semibold text-gray-800">{report.name}</h3>
                    {report.tags && report.tags.length > 0 && (
                      <div className="flex gap-1 ml-2">
                        {report.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1">
                            <TagIcon className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {report.description && (
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  )}
                  {report.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-sm text-gray-700">{report.notes}</p>
                    </div>
                  )}
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>{report.fields.length} fields</span>
                    <span>{report.filters.length} filters</span>
                    <span>Date range: {report.dateRange.type}</span>
                    {report.comparison?.enabled && <span>Comparison enabled</span>}
                    {report.createdAt && (
                      <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                    )}
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
                    onClick={() => {
                      setEmailReport(report)
                      setShowEmailModal(true)
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-1"
                    title="Email Report"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    Email
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
                      setShareReport(report)
                      setShowShareModal(true)
                    }}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Share Report"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => createReportSnapshot(report)}
                    className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                    title="Create Snapshot"
                  >
                    <CameraIcon className="h-5 w-5" />
                  </button>
                  {reportSnapshots[report._id || ''] && reportSnapshots[report._id || ''].length > 0 && (
                    <button
                      onClick={() => setShowSnapshots(showSnapshots === report._id ? null : report._id || null)}
                      className="p-1 text-cyan-600 hover:bg-cyan-50 rounded relative"
                      title="View Snapshots"
                    >
                      <ClockIconSolid className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 bg-cyan-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {reportSnapshots[report._id || ''].length}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => exportReportAsJSON(report)}
                    className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                    title="Export as JSON"
                  >
                    <DocumentChartBarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => duplicateReport(report)}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                    title="Duplicate Report"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
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

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    })}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="e.g., monthly, payments, finance"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use tags to categorize and filter reports</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes/Comments</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    rows={3}
                    placeholder="Add notes or comments about this report..."
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
                    <optgroup label="Custom">
                      <option value="custom">Custom Range</option>
                    </optgroup>
                    <optgroup label="This Period">
                      <option value="this_month">This Month</option>
                      <option value="this_quarter">This Quarter</option>
                      <option value="this_year">This Year</option>
                      <option value="this_fiscal_year">This Fiscal Year</option>
                      <option value="mtd">Month to Date (MTD)</option>
                      <option value="qtd">Quarter to Date (QTD)</option>
                      <option value="ytd">Year to Date (YTD)</option>
                    </optgroup>
                    <optgroup label="Previous Period">
                      <option value="last_month">Last Month</option>
                      <option value="last_quarter">Last Quarter</option>
                      <option value="last_year">Last Year</option>
                      <option value="last_fiscal_year">Last Fiscal Year</option>
                    </optgroup>
                    <optgroup label="Rolling Periods">
                      <option value="last_30_days">Last 30 Days</option>
                      <option value="last_90_days">Last 90 Days</option>
                      <option value="last_365_days">Last 365 Days</option>
                    </optgroup>
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
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={formData.comparison?.enabled || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        comparison: { ...(formData.comparison || { enabled: false, type: 'year_over_year' }), enabled: e.target.checked }
                      })}
                    />
                    <span className="font-medium">Enable Comparison</span>
                  </label>
                  {formData.comparison?.enabled && (
                    <div className="ml-6 space-y-2">
                      <select
                        value={formData.comparison.type}
                        onChange={(e) => setFormData({
                          ...formData,
                          comparison: { ...formData.comparison!, type: e.target.value as any }
                        })}
                        className="w-full border rounded-lg px-4 py-2"
                      >
                        <option value="year_over_year">Year over Year</option>
                        <option value="period_over_period">Period over Period</option>
                        <option value="custom">Custom Period</option>
                      </select>
                      {formData.comparison.type === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <input
                            type="date"
                            value={formData.comparison.compareToStartDate || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              comparison: { ...formData.comparison!, compareToStartDate: e.target.value }
                            })}
                            className="border rounded-lg px-4 py-2"
                            placeholder="Start Date"
                          />
                          <input
                            type="date"
                            value={formData.comparison.compareToEndDate || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              comparison: { ...formData.comparison!, compareToEndDate: e.target.value }
                            })}
                            className="border rounded-lg px-4 py-2"
                            placeholder="End Date"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chart Settings */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={formData.chartSettings?.enabled || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        chartSettings: {
                          ...(formData.chartSettings || {
                            enabled: false,
                            chartType: 'bar',
                            showLegend: true,
                            showDataLabels: false
                          }),
                          enabled: e.target.checked
                        }
                      })}
                    />
                    <span className="font-medium">Enable Charts/Visualizations</span>
                  </label>
                  {formData.chartSettings?.enabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Chart Type</label>
                        <select
                          value={formData.chartSettings?.chartType || 'bar'}
                          onChange={(e) => setFormData({
                            ...formData,
                            chartSettings: { ...formData.chartSettings!, chartType: e.target.value as any }
                          })}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="area">Area Chart</option>
                          <option value="column">Column Chart</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">X-Axis Field</label>
                          <select
                            value={formData.chartSettings?.xAxisField || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              chartSettings: { ...formData.chartSettings!, xAxisField: e.target.value }
                            })}
                            className="w-full border rounded-lg px-4 py-2"
                          >
                            <option value="">Select field...</option>
                            {formData.fields.filter(f => f.dataType === 'string' || f.dataType === 'date').map(field => (
                              <option key={field.fieldName} value={field.fieldName}>{field.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Y-Axis Field</label>
                          <select
                            value={formData.chartSettings?.yAxisField || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              chartSettings: { ...formData.chartSettings!, yAxisField: e.target.value }
                            })}
                            className="w-full border rounded-lg px-4 py-2"
                          >
                            <option value="">Select field...</option>
                            {formData.fields.filter(f => f.dataType === 'number' || f.dataType === 'currency').map(field => (
                              <option key={field.fieldName} value={field.fieldName}>{field.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.chartSettings?.showLegend !== false}
                            onChange={(e) => setFormData({
                              ...formData,
                              chartSettings: { ...formData.chartSettings!, showLegend: e.target.checked }
                            })}
                          />
                          <span className="text-sm">Show Legend</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.chartSettings?.showDataLabels || false}
                            onChange={(e) => setFormData({
                              ...formData,
                              chartSettings: { ...formData.chartSettings!, showDataLabels: e.target.checked }
                            })}
                          />
                          <span className="text-sm">Show Data Labels</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Settings */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Export Settings</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Page Size</label>
                        <select
                          value={formData.exportSettings.pageSize}
                          onChange={(e) => setFormData({
                            ...formData,
                            exportSettings: { ...formData.exportSettings, pageSize: e.target.value as any }
                          })}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option value="letter">Letter</option>
                          <option value="a4">A4</option>
                          <option value="legal">Legal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Orientation</label>
                        <select
                          value={formData.exportSettings.pageOrientation}
                          onChange={(e) => setFormData({
                            ...formData,
                            exportSettings: { ...formData.exportSettings, pageOrientation: e.target.value as any }
                          })}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.exportSettings.includeSummary}
                          onChange={(e) => setFormData({
                            ...formData,
                            exportSettings: { ...formData.exportSettings, includeSummary: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Include Summary</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.exportSettings.includeCharts}
                          onChange={(e) => setFormData({
                            ...formData,
                            exportSettings: { ...formData.exportSettings, includeCharts: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Include Charts</span>
                      </label>
                    </div>
                  </div>
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
        {reportData && editingReport && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Report Results</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport(editingReport, 'pdf')}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => exportReport(editingReport, 'excel')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Export Excel
                </button>
                <button
                  onClick={() => exportReport(editingReport, 'csv')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>
            
            {reportData.summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-sm text-gray-600">{key}</span>
                      <span className="font-medium text-lg">
                        {typeof value === 'number' 
                          ? (key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('sum')
                              ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : value.toLocaleString())
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            {editingReport.chartSettings?.enabled && reportData.data && reportData.data.length > 0 && editingReport.chartSettings && (() => {
              const chartSettings = editingReport.chartSettings
              return (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4">Chart Visualization</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartSettings.chartType === 'bar' ? (
                      <BarChart data={reportData.data.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={chartSettings.xAxisField ? reportData.fields.find((f: any) => f.fieldName === chartSettings.xAxisField)?.label : reportData.fields[0]?.label}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        {chartSettings.showLegend && <Legend />}
                        {chartSettings.yAxisField ? (
                          <Bar 
                            dataKey={reportData.fields.find((f: any) => f.fieldName === chartSettings.yAxisField)?.label}
                            fill="#3b82f6"
                            label={chartSettings.showDataLabels}
                          />
                        ) : (
                          reportData.fields.filter((f: any) => f.dataType === 'number' || f.dataType === 'currency').slice(0, 3).map((field: any, idx: number) => (
                            <Bar 
                              key={field.fieldName}
                              dataKey={field.label}
                              fill={['#3b82f6', '#10b981', '#f59e0b'][idx]}
                              label={chartSettings.showDataLabels}
                            />
                          ))
                        )}
                      </BarChart>
                    ) : chartSettings.chartType === 'line' ? (
                      <LineChart data={reportData.data.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={chartSettings.xAxisField ? reportData.fields.find((f: any) => f.fieldName === chartSettings.xAxisField)?.label : reportData.fields[0]?.label}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        {chartSettings.showLegend && <Legend />}
                        {chartSettings.yAxisField ? (
                          <Line 
                            type="monotone"
                            dataKey={reportData.fields.find((f: any) => f.fieldName === chartSettings.yAxisField)?.label}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={chartSettings.showDataLabels}
                          />
                        ) : (
                          reportData.fields.filter((f: any) => f.dataType === 'number' || f.dataType === 'currency').slice(0, 3).map((field: any, idx: number) => (
                            <Line 
                              key={field.fieldName}
                              type="monotone"
                              dataKey={field.label}
                              stroke={['#3b82f6', '#10b981', '#f59e0b'][idx]}
                              strokeWidth={2}
                              dot={chartSettings.showDataLabels}
                            />
                          ))
                        )}
                      </LineChart>
                    ) : chartSettings.chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={reportData.data.slice(0, 10).map((row: any) => ({
                            name: row[reportData.fields.find((f: any) => f.fieldName === chartSettings.xAxisField)?.label || reportData.fields[0]?.label] || 'Unknown',
                            value: parseFloat(row[reportData.fields.find((f: any) => f.fieldName === chartSettings.yAxisField)?.label || reportData.fields.find((f: any) => f.dataType === 'currency' || f.dataType === 'number')?.label] || 0)
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={chartSettings.showDataLabels ? ({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.data.slice(0, 10).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'][index % 10]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        {chartSettings.showLegend && <Legend />}
                      </PieChart>
                    ) : chartSettings.chartType === 'area' ? (
                      <AreaChart data={reportData.data.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={chartSettings.xAxisField ? reportData.fields.find((f: any) => f.fieldName === chartSettings.xAxisField)?.label : reportData.fields[0]?.label}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        {chartSettings.showLegend && <Legend />}
                        {chartSettings.yAxisField ? (
                          <Area 
                            type="monotone"
                            dataKey={reportData.fields.find((f: any) => f.fieldName === chartSettings.yAxisField)?.label}
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                          />
                        ) : (
                          reportData.fields.filter((f: any) => f.dataType === 'number' || f.dataType === 'currency').slice(0, 3).map((field: any, idx: number) => (
                            <Area 
                              key={field.fieldName}
                              type="monotone"
                              dataKey={field.label}
                              stroke={['#3b82f6', '#10b981', '#f59e0b'][idx]}
                              fill={['#3b82f6', '#10b981', '#f59e0b'][idx]}
                              fillOpacity={0.6}
                            />
                          ))
                        )}
                      </AreaChart>
                    ) : chartSettings.chartType === 'column' ? (
                      <BarChart data={reportData.data.slice(0, 20)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category"
                          dataKey={chartSettings.xAxisField ? reportData.fields.find((f: any) => f.fieldName === chartSettings.xAxisField)?.label : reportData.fields[0]?.label}
                          width={150}
                        />
                        <Tooltip />
                        {chartSettings.showLegend && <Legend />}
                        {chartSettings.yAxisField ? (
                          <Bar 
                            dataKey={reportData.fields.find((f: any) => f.fieldName === chartSettings.yAxisField)?.label}
                            fill="#3b82f6"
                            label={chartSettings.showDataLabels}
                          />
                        ) : (
                          reportData.fields.filter((f: any) => f.dataType === 'number' || f.dataType === 'currency').slice(0, 3).map((field: any, idx: number) => (
                            <Bar 
                              key={field.fieldName}
                              dataKey={field.label}
                              fill={['#3b82f6', '#10b981', '#f59e0b'][idx]}
                              label={chartSettings.showDataLabels}
                            />
                          ))
                        )}
                      </BarChart>
                    ) : (
                      <BarChart data={reportData.data.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={reportData.fields[0]?.label} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={reportData.fields.find((f: any) => f.dataType === 'currency' || f.dataType === 'number')?.label} fill="#3b82f6" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
              )
            })()}

            {reportData.data && reportData.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {reportData.fields.map((field: any) => (
                        <th key={field.fieldName} className="border px-4 py-2 text-left font-semibold">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {reportData.fields.map((field: any) => {
                          const value = row[field.label] || '-'
                          const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)))
                          const isCurrency = field.dataType === 'currency' && isNumeric
                          return (
                            <td key={field.fieldName} className="border px-4 py-2">
                              {isCurrency 
                                ? `$${parseFloat(String(value)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : isNumeric
                                  ? parseFloat(String(value)).toLocaleString()
                                  : value}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {reportData.data && reportData.data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No data found for the selected criteria.</p>
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

        {/* Email Report Modal */}
        {showEmailModal && emailReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Email Report</h2>
                <button
                  onClick={() => {
                    setShowEmailModal(false)
                    setEmailReport(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <EmailReportForm
                report={emailReport}
                onSend={sendReportEmail}
                onCancel={() => {
                  setShowEmailModal(false)
                  setEmailReport(null)
                }}
              />
            </div>
          </div>
        )}

        {/* Share Report Modal */}
        {showShareModal && shareReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Share Report: {shareReport.name}</h2>
                <button
                  onClick={() => {
                    setShowShareModal(false)
                    setShareReport(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <ShareReportForm
                report={shareReport}
                users={users}
                onShare={shareReportWithUsers}
                onCancel={() => {
                  setShowShareModal(false)
                  setShareReport(null)
                }}
              />
            </div>
          </div>
        )}

        {/* Snapshots Panel */}
        {showSnapshots && reportSnapshots[showSnapshots] && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Report Snapshots</h2>
                <button
                  onClick={() => setShowSnapshots(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {reportSnapshots[showSnapshots].map((snapshot, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{snapshot.reportName}</h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(snapshot.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          By: {snapshot.createdBy}
                        </p>
                        {snapshot.reportData?.data && (
                          <p className="text-sm text-gray-500 mt-1">
                            {snapshot.reportData.data.length} rows
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          loadReportSnapshot(showSnapshots, snapshot)
                          setShowSnapshots(null)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Load Snapshot
                      </button>
                    </div>
                  </div>
                ))}
                {reportSnapshots[showSnapshots].length === 0 && (
                  <p className="text-center text-gray-500 py-8">No snapshots available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ShareReportForm({ report, users, onShare, onCancel }: { report: CustomReport, users: any[], onShare: (report: CustomReport, userIds: string[], permission: 'view' | 'edit') => void, onCancel: () => void }) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [permission, setPermission] = useState<'view' | 'edit'>('view')

  const handleShare = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user')
      return
    }
    onShare(report, selectedUsers, permission)
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Select Users</label>
        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
          {users.filter(u => u._id !== report._id).map(user => (
            <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, user._id])
                  } else {
                    setSelectedUsers(selectedUsers.filter(id => id !== user._id))
                  }
                }}
              />
              <span>{user.name || user.email}</span>
              {user.role && (
                <span className="text-xs text-gray-500">({user.role})</span>
              )}
            </label>
          ))}
          {users.length === 0 && (
            <p className="text-gray-500 text-sm">No users available</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Permission</label>
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="view">View Only</option>
          <option value="edit">Can Edit</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleShare}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Share Report
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function EmailReportForm({ report, onSend, onCancel }: { report: CustomReport, onSend: (report: CustomReport, recipients: string[], subject: string, message: string, format: 'pdf' | 'excel' | 'csv') => void, onCancel: () => void }) {
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState(`Report: ${report.name}`)
  const [message, setMessage] = useState('Please find the attached report.')
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')

  const handleSend = () => {
    const recipientList = recipients.split(',').map(email => email.trim()).filter(email => email)
    if (recipientList.length === 0) {
      alert('Please enter at least one email address')
      return
    }
    onSend(report, recipientList, subject, message, format)
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Recipients (comma-separated)</label>
        <input
          type="text"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
          placeholder="email1@example.com, email2@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
          <option value="csv">CSV</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleSend}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Send Report
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
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

