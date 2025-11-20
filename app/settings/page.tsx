'use client'

import { useState, useEffect, useMemo } from 'react'
import { EnvelopeIcon, PlusIcon, PencilIcon, TrashIcon, CalendarIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon, UserGroupIcon, PrinterIcon, DocumentArrowDownIcon, Cog6ToothIcon, DocumentTextIcon, XMarkIcon, ShieldCheckIcon, TagIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ComputerDesktopIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import React from 'react'
import TwoFactorAuth from '@/app/components/TwoFactorAuth'
import { getUser } from '@/lib/auth'
import Modal from '@/app/components/Modal'
import ConfirmationDialog from '@/app/components/ConfirmationDialog'
import { showToast } from '@/app/components/Toast'
import VariablePicker from '@/app/components/VariablePicker'

interface LifecycleEventType {
  _id: string
  type: string
  name: string
  amount: number
}

interface Family {
  _id: string
  name: string
  weddingDate: string
}

interface PaymentPlan {
  _id: string
  name: string
  yearlyPrice: number
  familyCount?: number
  families?: Family[]
}

type SettingsSection = 'email' | 'eventTypes' | 'paymentPlans' | 'kevittel' | 'cycle' | 'stripe' | 'automations' | 'templates' | 'security' | 'roles' | 'auditLogs' | 'sessions' | 'familyTags' | 'familyGroups' | 'backup'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('email')
  
  // Stripe Configuration state
  const [stripeConfig, setStripeConfig] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Email Configuration state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: '',
    fromName: 'Kasa Family Management'
  })
  
  // Debug: Log emailFormData changes
  useEffect(() => {
    console.log('📧 Email formData changed:', { email: emailFormData.email, fromName: emailFormData.fromName })
  }, [emailFormData.email, emailFormData.fromName])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Event Types state
  const [eventTypes, setEventTypes] = useState<LifecycleEventType[]>([])
  const [eventTypesLoading, setEventTypesLoading] = useState(true)
  const [showEventTypeModal, setShowEventTypeModal] = useState(false)
  const [editingEventType, setEditingEventType] = useState<LifecycleEventType | null>(null)
  const [eventTypeFormData, setEventTypeFormData] = useState({
    type: '',
    name: '',
    amount: ''
  })

  // Payment Plans state
  const [plans, setPlans] = useState<PaymentPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [planFormData, setPlanFormData] = useState({
    name: '',
    yearlyPrice: 0
  })

  // Kevittel state
  const [kevittelFamilies, setKevittelFamilies] = useState<any[]>([])
  const [kevittelLoading, setKevittelLoading] = useState(true)
  const [editingKevittel, setEditingKevittel] = useState<{ familyId: string; entryIndex: number } | null>(null)
  const [kevittelEditText, setKevittelEditText] = useState('')

  // Cycle Configuration state
  const [cycleConfig, setCycleConfig] = useState<any>(null)
  const [cycleLoading, setCycleLoading] = useState(true)
  const [cycleFormData, setCycleFormData] = useState({
    cycleStartMonth: 9, // September default
    cycleStartDay: 1,
    description: 'Membership cycle start date'
  })

  // Automation Settings state
  const [automationSettings, setAutomationSettings] = useState<any>(null)
  const [automationLoading, setAutomationLoading] = useState(true)
  const [automationSaving, setAutomationSaving] = useState(false)
  const [automationFormData, setAutomationFormData] = useState({
    enableMonthlyPayments: true,
    enableStatementGeneration: true,
    enableStatementEmails: true,
    enableWeddingConversion: true,
    enableTaskEmails: true,
    enableFamilyWelcomeEmails: true,
    enablePaymentEmails: true,
    enableFamilyWelcomeSMS: false,
    enablePaymentSMS: false,
    enablePaymentReminders: false,
    reminderDaysBefore: [3, 1],
  })

  // Invoice Template state
  const [templates, setTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [templateFormData, setTemplateFormData] = useState({
    templateType: 'invoice' as 'invoice' | 'receipt',
    templateName: 'Default',
    headerLogo: '',
    headerText: 'KASA',
    headerSubtext: 'Family Management',
    headerColor: '#333333',
    primaryColor: '#333333',
    secondaryColor: '#666666',
    fontFamily: 'Arial, sans-serif',
    footerText: 'Thank you for your business!',
    footerSubtext: 'Kasa Family Management',
    customCSS: '',
    isDefault: false
  })

  // Roles & Permissions state
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Set<string>>(new Set())
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [roleFormData, setRoleFormData] = useState({ name: '', displayName: '', description: '', permissions: [] as string[] })

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditFilters, setAuditFilters] = useState({ userId: '', entityType: '', action: '', startDate: '', endDate: '' })

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [sessionToRevoke, setSessionToRevoke] = useState<any>(null)

  // Family Tags state
  const [familyTags, setFamilyTags] = useState<any[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)
  const [tagFormData, setTagFormData] = useState({ name: '', color: '#3b82f6', description: '' })

  // Family Groups state
  const [familyGroups, setFamilyGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [groupFormData, setGroupFormData] = useState<{ name: string; color: string; description: string; families: Array<{ _id: string; name: string }> }>({ name: '', color: '#3b82f6', description: '', families: [] })
  const [allFamilies, setAllFamilies] = useState<any[]>([])

  // Backup state
  const [backups, setBackups] = useState<any[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupType, setBackupType] = useState('full')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    // Fetch user role first to determine which tabs to show
    const fetchUserRole = async () => {
      // First, try to get role from localStorage user object (fastest)
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const userData = JSON.parse(userStr)
          if (userData.role) {
            setUserRole(userData.role)
            console.log('📋 User role from localStorage:', userData.role)
          }
        }
      } catch (e) {
        console.error('Error parsing localStorage user:', e)
      }
      
      // Then fetch from API to get latest role
      try {
        const token = localStorage.getItem('token')
        const userRes = await fetch('/api/users/me', {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {}
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUserRole(userData.role)
          setCurrentUser(userData)
          console.log('📋 User role from API:', userData.role)
        } else {
          // Fallback: try to get role from token
          try {
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]))
              if (payload.role) {
                setUserRole(payload.role)
                console.log('📋 User role from token:', payload.role)
              }
            }
          } catch (e) {
            console.error('Error parsing token:', e)
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    
    fetchUserRole()
    fetchEmailConfig()
    fetchEventTypes()
    fetchPlans()
    fetchKevittelData()
    fetchCycleConfig()
    fetchAutomationSettings()
    fetchTemplates()
  }, [])

  // Load data when specific sections are activated
  useEffect(() => {
    if (activeSection === 'familyTags' && !tagsLoading) {
      fetchFamilyTags()
    } else if (activeSection === 'familyGroups' && !groupsLoading) {
      fetchFamilyGroups()
      fetchAllFamilies()
    } else if (activeSection === 'backup' && !backupLoading) {
      fetchBackups()
    } else if (activeSection === 'sessions' && !sessionsLoading) {
      fetchSessions()
    } else if (activeSection === 'auditLogs' && !auditLogsLoading) {
      fetchAuditLogs()
    } else if (activeSection === 'roles' && !rolesLoading) {
      fetchRoles()
      fetchPermissions()
    } else if (activeSection === 'kevittel' && !kevittelLoading) {
      fetchKevittelData()
    }
  }, [activeSection])

  // Fetch functions for new tabs
  const fetchFamilyTags = async () => {
    try {
      setTagsLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/family-tags', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setFamilyTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  const fetchFamilyGroups = async () => {
    try {
      setGroupsLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/family-groups', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setFamilyGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const fetchAllFamilies = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/families', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setAllFamilies(data)
      }
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const fetchBackups = async () => {
    try {
      setBackupLoading(true)
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
      setBackupLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/sessions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        limit: '50',
        skip: '0',
      })
      if (auditFilters.userId) params.append('userId', auditFilters.userId)
      if (auditFilters.entityType) params.append('entityType', auditFilters.entityType)
      if (auditFilters.action) params.append('action', auditFilters.action)
      if (auditFilters.startDate) params.append('startDate', auditFilters.startDate)
      if (auditFilters.endDate) params.append('endDate', auditFilters.endDate)

      const res = await fetch(`/api/audit-logs?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setAuditLogsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      setRolesLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/roles', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles || data || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setRolesLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/permissions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setPermissions(data.permissions || data || [])
      } else {
        const error = await res.json()
        console.error('Error fetching permissions:', error)
        showToast(error.error || 'Failed to load permissions', 'error')
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      showToast('Error loading permissions', 'error')
    } finally {
      setPermissionsLoading(false)
    }
  }

  const loadRolePermissions = async (roleId: string) => {
    try {
      setLoadingRolePermissions(true)
      
      // Ensure permissions are loaded first
      if (permissions.length === 0) {
        await fetchPermissions()
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/roles/${roleId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        const role = data.role || data
        
        // Handle permissions - they come as populated objects with _id
        const permissionIds = role.permissions?.map((p: any) => {
          if (typeof p === 'object' && p._id) {
            return p._id.toString()
          }
          return typeof p === 'string' ? p : p.toString()
        }) || []
        
        // Match permissions by _id (as string) or by name
        const permissionNames = permissions
          .filter(p => {
            const permId = p._id?.toString() || p._id
            const permName = p.name
            return permissionIds.some((id: string) => {
              const idStr = id.toString()
              return idStr === permId || idStr === permName || 
                     (typeof p === 'object' && p._id && idStr === p._id.toString())
            })
          })
          .map(p => p.name)
        
        setSelectedRolePermissions(new Set(permissionNames))
        setSelectedRoleId(roleId)
        setEditingRole(role)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to load role permissions', 'error')
        setSelectedRoleId(null)
        setSelectedRolePermissions(new Set())
      }
    } catch (error) {
      console.error('Error loading role permissions:', error)
      showToast('Error loading role permissions', 'error')
      setSelectedRoleId(null)
      setSelectedRolePermissions(new Set())
    } finally {
      setLoadingRolePermissions(false)
    }
  }

  const handleCreateRole = async () => {
    setEditingRole(null)
    setRoleFormData({ name: '', displayName: '', description: '', permissions: [] })
    setSelectedRolePermissions(new Set())
    setShowRoleModal(true)
  }

  const handleSaveRole = async () => {
    try {
      setSavingPermissions(true)
      const token = localStorage.getItem('token')
      const permissionIds = permissions
        .filter(p => roleFormData.permissions.includes(p.name))
        .map(p => p._id)

      const url = editingRole ? `/api/roles/${editingRole._id}` : '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: roleFormData.name,
          displayName: roleFormData.displayName || roleFormData.name,
          description: roleFormData.description,
          permissions: permissionIds
        })
      })

      if (res.ok) {
        showToast(editingRole ? 'Role updated successfully' : 'Role created successfully', 'success')
        setShowRoleModal(false)
        setEditingRole(null)
        setRoleFormData({ name: '', displayName: '', description: '', permissions: [] })
        setSelectedRolePermissions(new Set())
        setSelectedRoleId(null)
        fetchRoles()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to save role', 'error')
      }
    } catch (error) {
      showToast('Failed to save role', 'error')
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will need to be reassigned.')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        showToast('Role deleted successfully', 'success')
        if (selectedRoleId === roleId) {
          setSelectedRoleId(null)
          setSelectedRolePermissions(new Set())
        }
        fetchRoles()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete role', 'error')
      }
    } catch (error) {
      showToast('Failed to delete role', 'error')
    }
  }

  const togglePermission = async (permissionName: string) => {
    if (!selectedRoleId) return

    const newPermissions = new Set(selectedRolePermissions)
    if (newPermissions.has(permissionName)) {
      newPermissions.delete(permissionName)
    } else {
      newPermissions.add(permissionName)
    }
    setSelectedRolePermissions(newPermissions)

    // Save immediately
    try {
      setSavingPermissions(true)
      const token = localStorage.getItem('token')
      const permissionIds = permissions
        .filter(p => newPermissions.has(p.name))
        .map(p => p._id)

      const res = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          permissions: permissionIds
        })
      })

      if (!res.ok) {
        // Revert on error
        setSelectedRolePermissions(selectedRolePermissions)
        const error = await res.json()
        showToast(error.error || 'Failed to update permissions', 'error')
      } else {
        showToast('Permissions updated', 'success')
      }
    } catch (error) {
      // Revert on error
      setSelectedRolePermissions(selectedRolePermissions)
      showToast('Failed to update permissions', 'error')
    } finally {
      setSavingPermissions(false)
    }
  }

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    permissions.forEach(perm => {
      const module = perm.module || 'other'
      if (!grouped[module]) {
        grouped[module] = []
      }
      grouped[module].push(perm)
    })
    return grouped
  }, [permissions])

  // Get module display name
  const getModuleDisplayName = (module: string) => {
    return module.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Standard permission actions
  const standardActions = ['view', 'create', 'update', 'delete']
  const extendedActions = ['export', 'import', 'refund', 'manage']

  // Refresh Kevittel data when switching to the Kevittel tab
  useEffect(() => {
    if (activeSection === 'kevittel' && !kevittelLoading) {
      fetchKevittelData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  // Email Configuration functions
  const fetchEmailConfig = async () => {
    try {
      const res = await fetch('/api/kasa/email-config')
      console.log('📧 Email config fetch - Status:', res.status, res.statusText)
      if (res.ok) {
        const config = await res.json()
        console.log('📧 Email config fetch - Found config:', config)
        setEmailConfig(config)
        setEmailFormData({
          email: config.email || '',
          password: '',
          fromName: config.fromName || 'Kasa Family Management'
        })
        console.log('📧 Email config fetch - Set formData.email to:', config.email || '(empty)')
      } else {
        // No config exists for this user - clear everything
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.log('📧 Email config fetch - No config found (404):', errorData)
        setEmailConfig(null)
        setEmailFormData({
          email: '',
          password: '',
          fromName: 'Kasa Family Management'
        })
        console.log('📧 Email config fetch - Cleared formData.email to empty string')
      }
    } catch (error) {
      console.error('Error fetching email config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!emailFormData.email) {
      setMessage({ type: 'error', text: 'Email address is required' })
      setSaving(false)
      return
    }

    if (!emailConfig && !emailFormData.password) {
      setMessage({ type: 'error', text: 'Password is required for new email configuration' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/kasa/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailFormData)
      })

      const result = await res.json()

      if (res.ok) {
        setEmailConfig(result)
        setEmailFormData(prev => ({ ...prev, password: '' }))
        setMessage({ 
          type: 'success', 
          text: emailConfig 
            ? 'Email configuration updated successfully!' 
            : 'Email configuration saved successfully!' 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save email configuration' })
      }
    } catch (error: any) {
      console.error('Error saving email config:', error)
      setMessage({ type: 'error', text: 'Error saving email configuration' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!emailConfig?.email) {
      setMessage({ type: 'error', text: 'Please save email configuration first' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/kasa/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send test email' })
      }
    } catch (error: any) {
      console.error('Error sending test email:', error)
      setMessage({ type: 'error', text: 'Error sending test email' })
    } finally {
      setSaving(false)
    }
  }

  // Stripe Configuration functions
  const fetchStripeConfig = async () => {
    try {
      setStripeLoading(true)
      
      // Only fetch Stripe config if user is admin or super_admin
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        setStripeConfig(null)
        setStripeLoading(false)
        return
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('💳 No token found in localStorage')
        setStripeConfig(null)
        setStripeLoading(false)
        return
      }
      
      const res = await fetch('/api/kasa/stripe-config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('💳 Stripe config fetch - Status:', res.status, res.statusText)
      if (res.ok) {
        const config = await res.json()
        console.log('💳 Stripe config fetch - Found config:', config)
        setStripeConfig(config)
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.log('💳 Stripe config fetch - No config found:', errorData)
        setStripeConfig(null)
      }
    } catch (error) {
      console.error('Error fetching Stripe config:', error)
      setStripeConfig(null)
    } finally {
      setStripeLoading(false)
    }
  }
  
  // Refetch Stripe config when userRole changes
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'super_admin') {
      fetchStripeConfig()
    }
  }, [userRole])

  const handleConnectStripe = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please log in again.' })
        return
      }
      
      const res = await fetch('/api/kasa/stripe-config/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok && data.url) {
        // Redirect to Stripe OAuth
        window.location.href = data.url
      } else {
        // Display detailed error message
        let errorText = data.error || 'Failed to initiate Stripe connection'
        if (data.details) {
          errorText += `: ${data.details}`
        }
        if (data.helpUrl) {
          errorText += ` Visit ${data.helpUrl} to enable Connect.`
        }
        setMessage({ type: 'error', text: errorText })
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error)
      setMessage({ type: 'error', text: 'Error connecting Stripe account' })
    }
  }

  const handleDisconnectStripe = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? This will prevent processing payments.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please log in again.' })
        return
      }
      
      const res = await fetch('/api/kasa/stripe-config/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok) {
        setStripeConfig(null)
        setMessage({ type: 'success', text: 'Stripe account disconnected successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect Stripe account' })
      }
    } catch (error: any) {
      console.error('Error disconnecting Stripe:', error)
      setMessage({ type: 'error', text: 'Error disconnecting Stripe account' })
    }
  }

  // Cycle Configuration functions
  const fetchCycleConfig = async () => {
    try {
      setCycleLoading(true)
      const res = await fetch('/api/kasa/cycle-config')
      console.log('🔄 Cycle config fetch - Status:', res.status, res.statusText)
      if (res.ok) {
        const config = await res.json()
        console.log('🔄 Cycle config fetch - Found config:', config)
        setCycleConfig(config)
        setCycleFormData({
          cycleStartMonth: config.cycleStartMonth || 9,
          cycleStartDay: config.cycleStartDay || 1,
          description: config.description || 'Membership cycle start date'
        })
        console.log('🔄 Cycle config fetch - Set formData with saved values')
      } else {
        // No config exists for this user - clear everything
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.log('🔄 Cycle config fetch - No config found (404):', errorData)
        setCycleConfig(null)
        // Keep defaults but they're just placeholders, not saved values
        setCycleFormData({
          cycleStartMonth: 9, // Default form values (not saved)
          cycleStartDay: 1,
          description: 'Membership cycle start date'
        })
        console.log('🔄 Cycle config fetch - Set formData to defaults (not saved)')
      }
    } catch (error) {
      console.error('Error fetching cycle config:', error)
      setCycleConfig(null)
    } finally {
      setCycleLoading(false)
    }
  }

  const fetchAutomationSettings = async () => {
    try {
      setAutomationLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/automation-settings', {
        headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {}
      })
      if (res.ok) {
        const settings = await res.json()
        setAutomationSettings(settings)
        setAutomationFormData({
          enableMonthlyPayments: settings.enableMonthlyPayments ?? true,
          enableStatementGeneration: settings.enableStatementGeneration ?? true,
          enableStatementEmails: settings.enableStatementEmails ?? true,
          enableWeddingConversion: settings.enableWeddingConversion ?? true,
          enableTaskEmails: settings.enableTaskEmails ?? true,
          enableFamilyWelcomeEmails: settings.enableFamilyWelcomeEmails ?? true,
          enablePaymentEmails: settings.enablePaymentEmails ?? true,
          enableFamilyWelcomeSMS: settings.enableFamilyWelcomeSMS ?? false,
          enablePaymentSMS: settings.enablePaymentSMS ?? false,
          enablePaymentReminders: settings.enablePaymentReminders ?? false,
          reminderDaysBefore: settings.reminderDaysBefore || [3, 1],
        })
      } else {
        // Create default settings
        setAutomationSettings(null)
      }
    } catch (error) {
      console.error('Error fetching automation settings:', error)
      setAutomationSettings(null)
    } finally {
      setAutomationLoading(false)
    }
  }

  const handleSaveAutomationSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setAutomationSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/automation-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(automationFormData)
      })

      const result = await res.json()

      if (res.ok) {
        setAutomationSettings(result)
        setMessage({ 
          type: 'success', 
          text: 'Automation settings saved successfully!' 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save automation settings' })
      }
    } catch (error: any) {
      console.error('Error saving automation settings:', error)
      setMessage({ type: 'error', text: 'Error saving automation settings' })
    } finally {
      setAutomationSaving(false)
    }
  }

  // Template functions
  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/invoice-templates', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setTemplates(data)
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setTemplateFormData({
      templateType: template.templateType,
      templateName: template.templateName || 'Default',
      headerLogo: template.headerLogo || '',
      headerText: template.headerText || 'KASA',
      headerSubtext: template.headerSubtext || 'Family Management',
      headerColor: template.headerColor || '#333333',
      primaryColor: template.primaryColor || '#333333',
      secondaryColor: template.secondaryColor || '#666666',
      fontFamily: template.fontFamily || 'Arial, sans-serif',
      footerText: template.footerText || 'Thank you for your business!',
      footerSubtext: template.footerSubtext || 'Kasa Family Management',
      customCSS: template.customCSS || '',
      isDefault: template.isDefault || false
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/invoice-templates/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        fetchTemplates()
        setMessage({ type: 'success', text: 'Template deleted successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete template' })
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      setMessage({ type: 'error', text: 'Failed to delete template' })
    }
  }

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/invoice-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(templateFormData)
      })

      const result = await res.json()

      if (res.ok) {
        setShowTemplateModal(false)
        setEditingTemplate(null)
        setTemplateFormData({
          templateType: 'invoice',
          templateName: 'Default',
          headerLogo: '',
          headerText: 'KASA',
          headerSubtext: 'Family Management',
          headerColor: '#333333',
          primaryColor: '#333333',
          secondaryColor: '#666666',
          fontFamily: 'Arial, sans-serif',
          footerText: 'Thank you for your business!',
          footerSubtext: 'Kasa Family Management',
          customCSS: '',
          isDefault: false
        })
        fetchTemplates()
        setMessage({ 
          type: 'success', 
          text: editingTemplate ? 'Template updated successfully!' : 'Template created successfully!' 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save template' })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      setMessage({ type: 'error', text: 'Failed to save template' })
    }
  }

  const handleSaveCycleConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/kasa/cycle-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycleFormData)
      })

      const result = await res.json()

      if (res.ok) {
        setCycleConfig(result)
        setMessage({ 
          type: 'success', 
          text: cycleConfig 
            ? 'Cycle configuration updated successfully!' 
            : 'Cycle configuration saved successfully!' 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save cycle configuration' })
      }
    } catch (error: any) {
      console.error('Error saving cycle config:', error)
      setMessage({ type: 'error', text: 'Error saving cycle configuration' })
    } finally {
      setSaving(false)
    }
  }

  // Event Types functions
  const fetchEventTypes = async () => {
    try {
      const res = await fetch('/api/kasa/lifecycle-event-types')
      const data = await res.json()
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
        setEventTypes(sorted)
      } else {
        setEventTypes([])
      }
    } catch (error) {
      console.error('Error fetching event types:', error)
      setEventTypes([])
    } finally {
      setEventTypesLoading(false)
    }
  }

  const initializeEventTypeDefaults = async () => {
    if (!confirm('This will create default event types if they don\'t exist. Continue?')) {
      return
    }

    try {
      const res = await fetch('/api/kasa/lifecycle-event-types/initialize', {
        method: 'POST'
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Default event types initialized successfully!' })
        fetchEventTypes()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to initialize defaults' })
      }
    } catch (error) {
      console.error('Error initializing defaults:', error)
      setMessage({ type: 'error', text: 'Failed to initialize default event types' })
    }
  }

  const resetEventTypeForm = () => {
    setEventTypeFormData({
      type: '',
      name: '',
      amount: ''
    })
    setEditingEventType(null)
  }

  const handleEditEventType = (eventType: LifecycleEventType) => {
    setEditingEventType(eventType)
    setEventTypeFormData({
      type: eventType.type,
      name: eventType.name,
      amount: eventType.amount.toString()
    })
    setShowEventTypeModal(true)
  }

  const handleDeleteEventType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event type?')) {
      return
    }

    try {
      const res = await fetch(`/api/kasa/lifecycle-event-types/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Event type deleted successfully!' })
        fetchEventTypes()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete event type' })
      }
    } catch (error) {
      console.error('Error deleting event type:', error)
      setMessage({ type: 'error', text: 'Failed to delete event type' })
    }
  }

  const handleSubmitEventType = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingEventType
        ? `/api/kasa/lifecycle-event-types/${editingEventType._id}`
        : '/api/kasa/lifecycle-event-types'
      
      const method = editingEventType ? 'PUT' : 'POST'
      
      const body = editingEventType
        ? { name: eventTypeFormData.name, amount: eventTypeFormData.amount }
        : { type: eventTypeFormData.type, name: eventTypeFormData.name, amount: eventTypeFormData.amount }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowEventTypeModal(false)
        resetEventTypeForm()
        setMessage({ 
          type: 'success', 
          text: editingEventType ? 'Event type updated successfully!' : 'Event type created successfully!' 
        })
        fetchEventTypes()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save event type' })
      }
    } catch (error) {
      console.error('Error saving event type:', error)
      setMessage({ type: 'error', text: 'Failed to save event type' })
    }
  }

  // Payment Plans functions
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/kasa/payment-plans')
      const data = await res.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching payment plans:', error)
    } finally {
      setPlansLoading(false)
    }
  }

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPlan 
        ? `/api/kasa/payment-plans/${editingPlan._id}`
        : '/api/kasa/payment-plans'
      
      const method = editingPlan ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planFormData)
      })

      if (res.ok) {
        setShowPlanModal(false)
        setEditingPlan(null)
        resetPlanForm()
        fetchPlans()
        setMessage({ type: 'success', text: editingPlan ? 'Payment plan updated successfully!' : 'Payment plan created successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save payment plan' })
      }
    } catch (error) {
      console.error('Error saving payment plan:', error)
      setMessage({ type: 'error', text: 'Failed to save payment plan' })
    }
  }

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan)
    setPlanFormData({
      name: plan.name,
      yearlyPrice: plan.yearlyPrice
    })
    setShowPlanModal(true)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment plan?')) return
    
    try {
      const res = await fetch(`/api/kasa/payment-plans/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPlans()
        setMessage({ type: 'success', text: 'Payment plan deleted successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete payment plan' })
      }
    } catch (error) {
      console.error('Error deleting payment plan:', error)
      setMessage({ type: 'error', text: 'Failed to delete payment plan' })
    }
  }

  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      yearlyPrice: 0
    })
  }

  const toggleExpandPlan = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId)
  }

  // Kevittel edit functions
  const handleEditKevittel = (familyId: string, entryIndex: number, currentText: string) => {
    setEditingKevittel({ familyId, entryIndex })
    setKevittelEditText(currentText)
  }

  const handleSaveKevittel = async (familyId: string, entryIndex: number) => {
    try {
      const family = kevittelFamilies.find(f => f._id === familyId)
      if (!family) return

      // Parse the edited text to update the appropriate field
      const editedText = kevittelEditText.trim()
      
      // Determine which field to update based on entryIndex
      // 0 = husband, 1 = wife, 2+ = children
      const entries: string[] = []
      if (family.husbandHebrewName && family.husbandHebrewName.trim() !== '') {
        let husbandEntry = family.husbandHebrewName
        if (family.husbandFatherHebrewName && family.husbandFatherHebrewName.trim() !== '') {
          husbandEntry += ` בן ${family.husbandFatherHebrewName}`
        }
        entries.push(husbandEntry)
      }
      if (family.wifeHebrewName && family.wifeHebrewName.trim() !== '') {
        let wifeEntry = `וזו' ${family.wifeHebrewName}`
        if (family.wifeFatherHebrewName && family.wifeFatherHebrewName.trim() !== '') {
          wifeEntry += ` בת ${family.wifeFatherHebrewName}`
        }
        entries.push(wifeEntry)
      }
      const children = family.members || []
      children.forEach((child: any) => {
        const childHebrewName = child.hebrewFirstName || ''
        if (childHebrewName && childHebrewName.trim() !== '') {
          entries.push(`ב' ${childHebrewName}`)
        }
      })

      if (entryIndex === 0 && entries.length > 0) {
        // Editing husband entry
        const parts = editedText.split(' בן ')
        const husbandName = parts[0].trim()
        const fatherName = parts.length > 1 ? parts[1].trim() : ''
        
        const updateData: any = { husbandHebrewName: husbandName }
        if (fatherName) {
          updateData.husbandFatherHebrewName = fatherName
        }
        
        const res = await fetch(`/api/kasa/families/${familyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        
        if (res.ok) {
          await fetchKevittelData()
        }
      } else if (entryIndex === 1 && entries.length > 1) {
        // Editing wife entry
        const wifeText = editedText.replace(/^וזו'?\s*/, '').trim()
        const parts = wifeText.split(' בת ')
        const wifeName = parts[0].trim()
        const fatherName = parts.length > 1 ? parts[1].trim() : ''
        
        const updateData: any = { wifeHebrewName: wifeName }
        if (fatherName) {
          updateData.wifeFatherHebrewName = fatherName
        }
        
        const res = await fetch(`/api/kasa/families/${familyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        
        if (res.ok) {
          await fetchKevittelData()
        }
      } else if (entryIndex >= 2) {
        // Editing child entry
        const childText = editedText.replace(/^ב'?\s*/, '').trim()
        const childIndex = entryIndex - 2
        const children = family.members || []
        if (children[childIndex]) {
          const res = await fetch(`/api/kasa/families/${familyId}/members/${children[childIndex]._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hebrewFirstName: childText })
          })
          
          if (res.ok) {
            await fetchKevittelData()
          }
        }
      }
      
      setEditingKevittel(null)
      setKevittelEditText('')
    } catch (error) {
      console.error('Error saving kevittel:', error)
      alert('Error saving kevittel entry')
    }
  }

  const handleCancelEditKevittel = () => {
    setEditingKevittel(null)
    setKevittelEditText('')
  }

  // Kevittel functions
  const fetchKevittelData = async () => {
    try {
      // Fetch all families
      const familiesRes = await fetch('/api/kasa/families')
      if (!familiesRes.ok) {
        console.error('Failed to fetch families:', familiesRes.status)
        setKevittelFamilies([])
        setKevittelLoading(false)
        return
      }
      
      const families = await familiesRes.json()
      console.log('Fetched families:', families.length)
      
      // Log Hebrew names from fetched families
      families.forEach((family: any, index: number) => {
        console.log(`Family ${index + 1} (${family.name}):`, {
          hebrewName: family.hebrewName || '(empty)',
          husbandHebrewName: family.husbandHebrewName || '(empty)',
          husbandFatherHebrewName: family.husbandFatherHebrewName || '(empty)',
          wifeHebrewName: family.wifeHebrewName || '(empty)',
          wifeFatherHebrewName: family.wifeFatherHebrewName || '(empty)'
        })
      })
      
      // Fetch members for each family and sort by age
      const familiesWithMembers = await Promise.all(
        families.map(async (family: any) => {
          try {
            const membersRes = await fetch(`/api/kasa/families/${family._id}/members`)
            if (!membersRes.ok) {
              console.error(`Failed to fetch members for family ${family._id}:`, membersRes.status)
              return { ...family, members: [] }
            }
            
            const members = await membersRes.json()
            
            // Debug: Log members for this family
            console.log(`Family "${family.name}" members:`, members.map((m: any) => ({
              name: `${m.firstName} ${m.lastName}`,
              hebrewFirstName: m.hebrewFirstName || '(empty)',
              hebrewLastName: m.hebrewLastName || '(empty)'
            })))
            
            // Sort children by birthDate (oldest first)
            const sortedChildren = members
              .filter((member: any) => member.birthDate)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.birthDate).getTime()
                const dateB = new Date(b.birthDate).getTime()
                return dateA - dateB // Oldest first
              })
            
            return {
              ...family,
              members: sortedChildren
            }
          } catch (error) {
            console.error(`Error fetching members for family ${family._id}:`, error)
            return { ...family, members: [] }
          }
        })
      )
      
      console.log('Families with members:', familiesWithMembers.length)
      console.log('Sample family:', familiesWithMembers[0])
      
      // Log which families have Hebrew names
      const familiesWithHebrewNames = familiesWithMembers.filter((family: any) => {
        const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
        const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
        const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
        return hasHusbandName || hasWifeName || hasChildren
      })
      console.log(`Families with Hebrew names: ${familiesWithHebrewNames.length} out of ${familiesWithMembers.length}`)
      
      setKevittelFamilies(familiesWithMembers)
    } catch (error) {
      console.error('Error fetching kevittel data:', error)
      setKevittelFamilies([])
    } finally {
      setKevittelLoading(false)
    }
  }

  if (loading || eventTypesLoading || plansLoading || kevittelLoading || cycleLoading || stripeLoading) {
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600">Manage your system configuration</p>
        </div>

        {/* Sidebar Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-2 sticky top-8">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection('email')}
                  className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === 'email'
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  Email Configuration
                </button>
                <button
                  onClick={() => setActiveSection('eventTypes')}
                  className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === 'eventTypes'
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Event Types
                </button>
                <button
                  onClick={() => setActiveSection('paymentPlans')}
                  className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === 'paymentPlans'
                      ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <CreditCardIcon className="h-5 w-5" />
                  Payment Plans
                </button>
                <button
                  onClick={() => setActiveSection('kevittel')}
                  className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === 'kevittel'
                      ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5" />
                  Kevittel
                </button>
                <button
                  onClick={() => setActiveSection('cycle')}
                  className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === 'cycle'
                      ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Cycle
                </button>
                {(userRole === 'admin' || userRole === 'super_admin') && (
                  <>
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">Administration</p>
                    </div>
                    <button
                      onClick={() => setActiveSection('stripe')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'stripe'
                          ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <CreditCardIcon className="h-5 w-5" />
                      Stripe Connection
                    </button>
                    <button
                      onClick={() => setActiveSection('automations')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'automations'
                          ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      Automations
                    </button>
                    <button
                      onClick={() => setActiveSection('templates')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'templates'
                          ? 'bg-teal-100 text-teal-700 border-l-4 border-teal-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                      Templates
                    </button>
                    <button
                      onClick={() => setActiveSection('security')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'security'
                          ? 'bg-red-100 text-red-700 border-l-4 border-red-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                      Security
                    </button>
                    <button
                      onClick={() => setActiveSection('roles')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'roles'
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                      Roles & Permissions
                    </button>
                    <button
                      onClick={() => setActiveSection('sessions')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'sessions'
                          ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <ComputerDesktopIcon className="h-5 w-5" />
                      Sessions
                    </button>
                    <button
                      onClick={() => setActiveSection('familyTags')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'familyTags'
                          ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <TagIcon className="h-5 w-5" />
                      Family Tags
                    </button>
                    <button
                      onClick={() => setActiveSection('familyGroups')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'familyGroups'
                          ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <UserGroupIcon className="h-5 w-5" />
                      Family Groups
                    </button>
                    <button
                      onClick={() => setActiveSection('backup')}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                        activeSection === 'backup'
                          ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Backup & Restore
                    </button>
                    {userRole === 'super_admin' && (
                      <button
                        onClick={() => setActiveSection('auditLogs')}
                        className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${
                          activeSection === 'auditLogs'
                            ? 'bg-gray-100 text-gray-700 border-l-4 border-gray-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                        Audit Logs
                      </button>
                    )}
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Email Configuration Section */}
            {activeSection === 'email' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Email Configuration</h2>
                <p className="text-sm text-gray-600">Configure Gmail settings for sending statements</p>
              </div>
            </div>

            {emailConfig ? (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ Email configuration is active:</strong> {emailConfig.email}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your email settings are saved and will be used automatically for sending statements.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠ No email configuration found.</strong> Please set up your email configuration below.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Each user must configure their own email settings. This configuration is separate from other users.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveEmailConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Gmail Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailFormData.email || ''}
                  onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                  placeholder="your-email@gmail.com"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gmail account to send statements from
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Gmail App Password {emailConfig ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  required={!emailConfig}
                  value={emailFormData.password}
                  onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                  placeholder={emailConfig ? "Leave empty to keep current password" : "16-character app password"}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate an app password from{' '}
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Google Account Settings
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  From Name
                </label>
                <input
                  type="text"
                  value={emailFormData.fromName}
                  onChange={(e) => setEmailFormData({ ...emailFormData, fromName: e.target.value })}
                  placeholder="Kasa Family Management"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display name shown in sent emails
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  {saving ? 'Saving...' : emailConfig ? 'Update Configuration' : 'Save Configuration'}
                </button>
                
                {emailConfig && (
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    Send Test Email
                  </button>
                )}
              </div>
            </form>

            {emailConfig && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Email configuration is stored securely in the database</li>
                  <li>Saved settings are used automatically for all statement emails</li>
                  <li>Monthly statements are sent automatically on the 1st of each month</li>
                  <li>You can send individual statements from the Statements page or Family detail page</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Event Types Tab */}
        {activeSection === 'eventTypes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Lifecycle Event Types</h2>
                  <p className="text-sm text-gray-600">Manage event types and their default amounts</p>
                </div>
              </div>
              <div className="flex gap-3">
                {eventTypes.length === 0 && (
                  <button
                    onClick={initializeEventTypeDefaults}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    Initialize Defaults
                  </button>
                )}
                <button
                  onClick={() => {
                    resetEventTypeForm()
                    setShowEventTypeModal(true)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Event Type
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventTypes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        No event types found. Click "Initialize Defaults" to create default event types (Bar Mitzvah, Chasena/Wedding, Birth Boy, Birth Girl) or "Add Event Type" to create a custom one.
                      </td>
                    </tr>
                  ) : (
                    eventTypes.map((eventType) => (
                      <tr key={eventType._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {eventType.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ${eventType.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEventType(eventType)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit Event Type"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEventType(eventType._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Event Type"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {eventTypes.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        Total ({eventTypes.length} event types):
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        ${eventTypes.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Payment Plans Tab */}
        {activeSection === 'paymentPlans' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Payment Plans</h2>
                  <p className="text-sm text-gray-600">Manage payment plans and view families using each plan</p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetPlanForm()
                  setEditingPlan(null)
                  setShowPlanModal(true)
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5" />
                Add Payment Plan
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yearly Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Families
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => {
                    const isExpanded = expandedPlan === plan._id
                    return (
                      <React.Fragment key={plan._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{plan.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold">
                            ${plan.yearlyPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            ${(plan.yearlyPrice / 12).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleExpandPlan(plan._id)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <UserGroupIcon className="h-5 w-5" />
                              <span className="font-medium">{plan.familyCount || 0} families</span>
                              {isExpanded ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit Plan"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Plan"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && plan.families && plan.families.length > 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="ml-8">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Families using this plan:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {plan.families.map((family) => (
                                    <Link
                                      key={family._id}
                                      href={`/families/${family._id}`}
                                      className="block p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                      <div className="font-medium text-gray-800">{family.name}</div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        Wedding: {new Date(family.weddingDate).toLocaleDateString()}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {isExpanded && (!plan.families || plan.families.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="ml-8 text-gray-500 text-sm">No families are currently using this plan.</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Event Type Modal */}
        {showEventTypeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">
                {editingEventType ? 'Edit' : 'Add'} Event Type
              </h2>
              <form onSubmit={handleSubmitEventType} className="space-y-4">
                {!editingEventType && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type Code *</label>
                    <input
                      type="text"
                      value={eventTypeFormData.type}
                      onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., chasena, bar_mitzvah"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique identifier (lowercase, use underscores)
                    </p>
                  </div>
                )}
                {editingEventType && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type Code</label>
                    <input
                      type="text"
                      value={eventTypeFormData.type}
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Type code cannot be changed after creation
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={eventTypeFormData.name}
                    onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Chasena, Bar Mitzvah"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={eventTypeFormData.amount}
                    onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, amount: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingEventType ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventTypeModal(false)
                      resetEventTypeForm()
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kevittel Tab */}
        {activeSection === 'kevittel' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-end mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      const familiesWithKevittel = kevittelFamilies
                        .filter((family) => {
                          const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
                          const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
                          const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
                          return hasHusbandName || hasWifeName || hasChildren
                        })
                        .map((family) => {
                          const husbandHebrewName = family.husbandHebrewName || ''
                          const husbandFatherHebrewName = family.husbandFatherHebrewName || ''
                          const wifeHebrewName = family.wifeHebrewName || ''
                          const wifeFatherHebrewName = family.wifeFatherHebrewName || ''
                          const children = family.members || []
                          
                          const entries: string[] = []
                          
                          // Husband: name + בן + father's name
                          if (husbandHebrewName && husbandHebrewName.trim() !== '') {
                            let husbandEntry = husbandHebrewName
                            if (husbandFatherHebrewName && husbandFatherHebrewName.trim() !== '') {
                              husbandEntry += ` בן ${husbandFatherHebrewName}`
                            }
                            entries.push(husbandEntry)
                          }
                          
                          // Wife: name + בת + father's name
                          if (wifeHebrewName && wifeHebrewName.trim() !== '') {
                            let wifeEntry = wifeHebrewName
                            if (wifeFatherHebrewName && wifeFatherHebrewName.trim() !== '') {
                              wifeEntry += ` בת ${wifeFatherHebrewName}`
                            }
                            entries.push(wifeEntry)
                          }
                          
                          // Children with "ב" prefix
                          children.forEach((child: any) => {
                            const childHebrewName = child.hebrewFirstName || ''
                            if (childHebrewName && childHebrewName.trim() !== '') {
                              entries.push(`ב' ${childHebrewName}`)
                            }
                          })
                          
                          return entries.join('<br>') // Join with <br> for HTML
                        })
                        .filter(text => text.trim() !== '')
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Kevittel</title>
                            <style>
                              @media print {
                                @page { margin: 2cm; }
                                body { margin: 0; }
                              }
                              body {
                                font-family: Arial Hebrew, David, sans-serif;
                                direction: rtl;
                                text-align: right;
                                padding: 40px;
                                line-height: 2;
                                font-size: 18px;
                              }
                              .kevittel-item {
                                margin-bottom: 20px;
                                padding: 10px 0;
                                border-bottom: 1px solid #eee;
                              }
                              .kevittel-item:last-child {
                                border-bottom: none;
                              }
                            </style>
                          </head>
                          <body>
                            ${familiesWithKevittel.map(text => `<div class="kevittel-item">${text}</div>`).join('')}
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Dynamically import html2pdf only in the browser
                      const html2pdf = (await import('html2pdf.js')).default
                      
                      if (kevittelFamilies.length === 0) {
                        alert('No kevittel data available. Please add Hebrew names to families.')
                        return
                      }
                      
                      const familiesWithKevittel = kevittelFamilies
                        .filter((family) => {
                          const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
                          const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
                          const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
                          return hasHusbandName || hasWifeName || hasChildren
                        })
                        .map((family) => {
                          const husbandHebrewName = family.husbandHebrewName || ''
                          const husbandFatherHebrewName = family.husbandFatherHebrewName || ''
                          const wifeHebrewName = family.wifeHebrewName || ''
                          const wifeFatherHebrewName = family.wifeFatherHebrewName || ''
                          const children = family.members || []
                          
                          const entries: string[] = []
                          
                          // Husband: name + בן + father's name
                          if (husbandHebrewName && husbandHebrewName.trim() !== '') {
                            let husbandEntry = husbandHebrewName
                            if (husbandFatherHebrewName && husbandFatherHebrewName.trim() !== '') {
                              husbandEntry += ` בן ${husbandFatherHebrewName}`
                            }
                            entries.push(husbandEntry)
                          }
                          
                          // Wife: name + בת + father's name
                          if (wifeHebrewName && wifeHebrewName.trim() !== '') {
                            let wifeEntry = wifeHebrewName
                            if (wifeFatherHebrewName && wifeFatherHebrewName.trim() !== '') {
                              wifeEntry += ` בת ${wifeFatherHebrewName}`
                            }
                            entries.push(wifeEntry)
                          }
                          
                          // Children with "ב" prefix
                          children.forEach((child: any) => {
                            const childHebrewName = child.hebrewFirstName || ''
                            if (childHebrewName && childHebrewName.trim() !== '') {
                              entries.push(`ב' ${childHebrewName}`)
                            }
                          })
                          
                          return entries.length > 0 ? { entries, familyName: family.name } : null
                        })
                        .filter((item): item is { entries: string[]; familyName: string } => item !== null)
                      
                      if (familiesWithKevittel.length === 0) {
                        alert('No kevittel data to export. Please add Hebrew names to families.')
                        return
                      }
                      
                      // Create a new window with the content for PDF generation
                      const printWindow = window.open('', '_blank')
                      if (!printWindow) {
                        alert('Please allow popups to generate PDF')
                        return
                      }
                      
                      const currentDate = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
                      
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html dir="rtl" lang="he">
                          <head>
                            <meta charset="UTF-8">
                            <title>Kevittel</title>
                            <style>
                              @media print {
                                @page { margin: 2cm; }
                                body { margin: 0; }
                              }
                              * {
                                direction: rtl;
                                text-align: right;
                              }
                              body {
                                font-family: Arial Hebrew, David, sans-serif;
                                direction: rtl;
                                text-align: right;
                                padding: 40px;
                                line-height: 2;
                                font-size: 18px;
                                background: white;
                              }
                              .kevittel-family {
                                margin-bottom: 30px;
                                padding-bottom: 20px;
                                border-bottom: 2px solid #ddd;
                                page-break-inside: avoid;
                              }
                              .kevittel-family:last-child {
                                border-bottom: none;
                              }
                              .kevittel-entry {
                                margin-bottom: 10px;
                                padding: 5px 0;
                                font-size: 18px;
                                line-height: 2;
                              }
                              .footer {
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                text-align: center;
                                direction: rtl;
                                font-size: 14px;
                                color: #666;
                              }
                            </style>
                          </head>
                          <body>
                            ${familiesWithKevittel.map(family => `
                              <div class="kevittel-family">
                                ${family.entries.map(entry => `<div class="kevittel-entry">${entry}</div>`).join('')}
                              </div>
                            `).join('')}
                            <div class="footer">
                              <p>נוצר ב-${currentDate}</p>
                              <p>מערכת ניהול משפחות קאסא</p>
                            </div>
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      
                      // Wait for content to load
                      await new Promise(resolve => setTimeout(resolve, 500))
                      
                      // Generate PDF from the new window's content
                      const contentElement = printWindow.document.body
                      
                      const opt = {
                        margin: [20, 20, 20, 20] as [number, number, number, number],
                        filename: `Kevittel_${new Date().toISOString().split('T')[0]}.pdf`,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: { 
                          scale: 2,
                          useCORS: true,
                          logging: false,
                          windowWidth: printWindow.innerWidth,
                          windowHeight: printWindow.innerHeight
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
                      }
                      
                      await html2pdf().set(opt).from(contentElement).save()
                      
                      // Close the print window
                      printWindow.close()
                    } catch (error) {
                      console.error('Error generating PDF:', error)
                      alert('Error generating PDF. Please try again.')
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Save as PDF
                </button>
              </div>
            </div>

            <div id="kevittel-content" className="space-y-4 print:space-y-2">
              {kevittelLoading ? (
                <div className="text-center py-12 text-gray-500">
                  Loading families...
                </div>
              ) : (() => {
                // Debug: Log what we have
                console.log('Kevittel families count:', kevittelFamilies.length)
                console.log('Kevittel families data:', kevittelFamilies)
                
                const familiesWithHebrewNames = kevittelFamilies.filter((family) => {
                  // Only show families that have at least one Hebrew name
                  const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
                  const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
                  const hasChildren = (family.members || []).some((child: any) => child.hebrewFirstName && child.hebrewFirstName.trim() !== '')
                  const hasAnyHebrewName = hasHusbandName || hasWifeName || hasChildren
                  
                  // Debug each family
                  if (!hasAnyHebrewName) {
                    console.log(`Family "${family.name}" filtered out:`, {
                      hasHusbandName,
                      hasWifeName,
                      hasChildren,
                      husbandHebrewName: family.husbandHebrewName,
                      wifeHebrewName: family.wifeHebrewName,
                      membersCount: (family.members || []).length
                    })
                  }
                  
                  return hasAnyHebrewName
                })
                
                console.log(`Filtered: ${familiesWithHebrewNames.length} families with Hebrew names out of ${kevittelFamilies.length} total`)
                
                if (kevittelFamilies.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      No families found.
                    </div>
                  )
                }
                
                if (familiesWithHebrewNames.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">
                        No families with Hebrew names found.
                      </p>
                      <p className="text-sm text-gray-400">
                        Please add Hebrew names to families in the Families section.
                      </p>
                      <p className="text-xs text-gray-300 mt-2">
                        Debug: Found {kevittelFamilies.length} families total. Check console for details.
                      </p>
                    </div>
                  )
                }
                
                return (
                  <>
                    {familiesWithHebrewNames.map((family) => {
                      const husbandHebrewName = family.husbandHebrewName || ''
                      const husbandFatherHebrewName = family.husbandFatherHebrewName || ''
                      const wifeHebrewName = family.wifeHebrewName || ''
                      const wifeFatherHebrewName = family.wifeFatherHebrewName || ''
                      const children = family.members || []
                      
                      // Build separate entries for each person (each on its own row)
                      const entries: string[] = []
                      
                      // Husband: name + בן + father's name
                      if (husbandHebrewName && husbandHebrewName.trim() !== '') {
                        let husbandEntry = husbandHebrewName
                        if (husbandFatherHebrewName && husbandFatherHebrewName.trim() !== '') {
                          husbandEntry += ` בן ${husbandFatherHebrewName}`
                        }
                        entries.push(husbandEntry)
                      }
                      
                      // Wife: זו' + name + בת + father's name
                      if (wifeHebrewName && wifeHebrewName.trim() !== '') {
                        let wifeEntry = `וזו' ${wifeHebrewName}`
                        if (wifeFatherHebrewName && wifeFatherHebrewName.trim() !== '') {
                          wifeEntry += ` בת ${wifeFatherHebrewName}`
                        }
                        entries.push(wifeEntry)
                      }
                      
                      // Add children with "ב" prefix, sorted by age (oldest first)
                      children.forEach((child: any) => {
                        const childHebrewName = child.hebrewFirstName || ''
                        if (childHebrewName && childHebrewName.trim() !== '') {
                          entries.push(`ב' ${childHebrewName}`)
                        }
                      })
                      
                      if (entries.length === 0) {
                        return null
                      }
                      
                      return (
                        <div 
                          key={family._id} 
                          className="border-b border-gray-200 py-3 print:py-2 print:border-gray-300"
                        >
                          {entries.map((entry, index) => {
                            const isEditing = editingKevittel?.familyId === family._id && editingKevittel?.entryIndex === index
                            
                            return (
                              <div 
                                key={index}
                                className="flex items-center gap-2 mb-2 last:mb-0 group"
                                dir="rtl"
                                lang="he"
                              >
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={kevittelEditText}
                                      onChange={(e) => setKevittelEditText(e.target.value)}
                                      className="flex-1 text-xl font-semibold text-gray-900 border border-blue-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      dir="rtl"
                                      lang="he"
                                      style={{ fontFamily: 'Arial Hebrew, David, sans-serif', textAlign: 'right', lineHeight: '1.8' }}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveKevittel(family._id, index)
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditKevittel()
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveKevittel(family._id, index)}
                                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditKevittel}
                                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div
                                      className="flex-1 text-xl font-semibold text-gray-900 print:text-lg print:font-normal"
                                      dir="rtl"
                                      lang="he"
                                      style={{ fontFamily: 'Arial Hebrew, David, sans-serif', textAlign: 'right', lineHeight: '1.8' }}
                                    >
                                      {entry}
                                    </div>
                                    <button
                                      onClick={() => handleEditKevittel(family._id, index, entry)}
                                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all text-sm"
                                      title="Edit"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }).filter(Boolean)}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Payment Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">
                {editingPlan ? 'Edit' : 'Add'} Payment Plan
              </h2>
              <form onSubmit={handleSubmitPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="e.g., Plan 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Yearly Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={planFormData.yearlyPrice}
                    onChange={(e) => setPlanFormData({ ...planFormData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanModal(false)
                      setEditingPlan(null)
                      resetPlanForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {editingPlan ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stripe Configuration Tab */}
        {activeSection === 'stripe' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Stripe Connection</h2>
              <p className="text-sm text-gray-600">Connect your Stripe account to process payments</p>
            </div>

            {stripeConfig ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>✓ Stripe account connected:</strong> {stripeConfig.accountName || stripeConfig.accountEmail || stripeConfig.stripeAccountId}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your Stripe account is connected and ready to process payments. All payments will be processed through your Stripe account.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleDisconnectStripe}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Disconnect Stripe Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <strong>⚠ No Stripe account connected.</strong> Please connect your Stripe account to process payments.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Each user must connect their own Stripe account. This allows you to process payments through your own Stripe account.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleConnectStripe}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Connect Stripe Account
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
                <li>Connect your Stripe account using OAuth</li>
                <li>All payments will be processed through your connected Stripe account</li>
                <li>You'll receive payments directly to your Stripe account</li>
                <li>Each user has their own separate Stripe connection</li>
                <li>You can disconnect and reconnect your account at any time</li>
              </ul>
            </div>
          </div>
        )}

        {/* Cycle Configuration Tab */}
        {activeSection === 'cycle' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Cycle Configuration</h2>
              <p className="text-sm text-gray-600">Configure the membership year start date</p>
            </div>

            {cycleConfig ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>✓ Cycle configuration is active:</strong> Membership year starts on{' '}
                  {new Date(2024, cycleConfig.cycleStartMonth - 1, cycleConfig.cycleStartDay).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Balances will be increased annually based on this date.
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <strong>⚠ No cycle configuration found.</strong> Please set up your cycle configuration below.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Each user must configure their own cycle settings. This configuration is separate from other users.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveCycleConfig} className="space-y-4">
              {!cycleConfig && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> The values below are default placeholders. They will only be saved when you click "Save Configuration".
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Cycle Start Month *
                </label>
                <select
                  value={cycleFormData.cycleStartMonth}
                  onChange={(e) => {
                    console.log('🔄 Cycle month onChange - New value:', e.target.value)
                    setCycleFormData({ ...cycleFormData, cycleStartMonth: parseInt(e.target.value) })
                  }}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${!cycleConfig ? 'border-yellow-300 bg-yellow-50' : ''}`}
                  required
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The month when the membership year begins
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Cycle Start Day *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={cycleFormData.cycleStartDay}
                  onChange={(e) => {
                    console.log('🔄 Cycle day onChange - New value:', e.target.value)
                    setCycleFormData({ ...cycleFormData, cycleStartDay: parseInt(e.target.value) || 1 })
                  }}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${!cycleConfig ? 'border-yellow-300 bg-yellow-50' : ''}`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The day of the month when the membership year begins (1-31)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={cycleFormData.description}
                  onChange={(e) => setCycleFormData({ ...cycleFormData, description: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${!cycleConfig ? 'border-yellow-300 bg-yellow-50' : ''}`}
                  placeholder="Membership cycle start date"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional description for this cycle configuration
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> When the cycle start date arrives each year, 
                    family balances will be increased based on their payment plans. This ensures 
                    that membership fees are properly tracked and calculated annually.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : cycleConfig ? 'Update Configuration' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Automation Settings Tab */}
        {activeSection === 'automations' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Automation Settings</h2>
              <p className="text-sm text-gray-600">Control which automations run automatically for your account</p>
            </div>

            {automationLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading automation settings...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveAutomationSettings} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> When enabled, these automations will run automatically via cron jobs. 
                    Each admin can control which automations are active for their account. Disabled automations can still be triggered manually.
                  </p>
                </div>

                {/* Monthly Payments Automation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">Monthly Recurring Payments</h3>
                      <p className="text-sm text-gray-600">Automatically charge saved cards for monthly payments (runs daily at 2 AM)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationFormData.enableMonthlyPayments}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, enableMonthlyPayments: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Statement Generation Automation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">Monthly Statement Generation</h3>
                      <p className="text-sm text-gray-600">Automatically generate PDF statements for all families (runs on 1st of month at 2 AM)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationFormData.enableStatementGeneration}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, enableStatementGeneration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Statement Email Automation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">Monthly Statement Emails</h3>
                      <p className="text-sm text-gray-600">Automatically send PDF statements via email to families (runs on 1st of month at 3 AM)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationFormData.enableStatementEmails}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, enableStatementEmails: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Wedding Conversion Automation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">Wedding Date Conversion</h3>
                      <p className="text-sm text-gray-600">Automatically convert members to families on their wedding date (runs daily at 1 AM)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationFormData.enableWeddingConversion}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, enableWeddingConversion: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Task Email Automation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">Task Due Date Emails</h3>
                      <p className="text-sm text-gray-600">Automatically send email reminders for tasks due today (runs daily at 9 AM)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationFormData.enableTaskEmails}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, enableTaskEmails: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Email Notifications Section */}
                <div className="pt-6 border-t-2 border-gray-300 mt-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Email Notifications</h2>
                  
                  {/* Family Welcome Emails */}
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">Family Welcome Emails</h3>
                        <p className="text-sm text-gray-600">Send welcome email with login URL and sign-in details when a new family is created</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={automationFormData.enableFamilyWelcomeEmails}
                          onChange={(e) => setAutomationFormData({ ...automationFormData, enableFamilyWelcomeEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Payment Confirmation Emails */}
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">Payment Confirmation Emails</h3>
                        <p className="text-sm text-gray-600">Send payment confirmation email to families when a payment is received</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={automationFormData.enablePaymentEmails}
                          onChange={(e) => setAutomationFormData({ ...automationFormData, enablePaymentEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="pt-4 border-t-2 border-gray-300 mt-4">
                    <h3 className="text-md font-bold text-gray-800 mb-4">SMS Notifications</h3>
                    <p className="text-sm text-gray-600 mb-4">SMS notifications are sent via email-to-SMS gateways (e.g., phonenumber@txt.att.net)</p>
                    
                    {/* Family Welcome SMS */}
                    <div className="border rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">Family Welcome SMS</h3>
                          <p className="text-sm text-gray-600">Send welcome SMS with login URL when a new family is created</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={automationFormData.enableFamilyWelcomeSMS}
                            onChange={(e) => setAutomationFormData({ ...automationFormData, enableFamilyWelcomeSMS: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Payment Confirmation SMS */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">Payment Confirmation SMS</h3>
                          <p className="text-sm text-gray-600">Send payment confirmation SMS to families when a payment is received</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={automationFormData.enablePaymentSMS}
                            onChange={(e) => setAutomationFormData({ ...automationFormData, enablePaymentSMS: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Reminders Section */}
                <div className="pt-6 border-t-2 border-gray-300 mt-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Reminders</h2>
                  <p className="text-sm text-gray-600 mb-4">Send reminders to families before their recurring payments are due</p>
                  
                  {/* Payment Reminders Toggle */}
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">Payment Reminders</h3>
                        <p className="text-sm text-gray-600">Send email and SMS reminders before payments are due</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={automationFormData.enablePaymentReminders}
                          onChange={(e) => setAutomationFormData({ ...automationFormData, enablePaymentReminders: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    
                    {automationFormData.enablePaymentReminders && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Send reminders (days before payment):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[7, 5, 3, 2, 1].map((days) => (
                            <label key={days} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={automationFormData.reminderDaysBefore.includes(days)}
                                onChange={(e) => {
                                  const current = automationFormData.reminderDaysBefore
                                  if (e.target.checked) {
                                    setAutomationFormData({
                                      ...automationFormData,
                                      reminderDaysBefore: [...current, days].sort((a, b) => b - a)
                                    })
                                  } else {
                                    setAutomationFormData({
                                      ...automationFormData,
                                      reminderDaysBefore: current.filter(d => d !== days)
                                    })
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">{days} {days === 1 ? 'day' : 'days'}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {automationFormData.reminderDaysBefore.length > 0 
                            ? automationFormData.reminderDaysBefore.sort((a, b) => b - a).join(', ') + ' days before'
                            : 'None selected'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    type="submit"
                    disabled={automationSaving}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {automationSaving ? 'Saving...' : 'Save Automation Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeSection === 'templates' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Invoice Templates</h2>
                  <p className="text-sm text-gray-600">Customize invoice and receipt templates</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingTemplate(null)
                  setTemplateFormData({
                    templateType: 'invoice',
                    templateName: 'Default',
                    headerLogo: '',
                    headerText: 'KASA',
                    headerSubtext: 'Family Management',
                    headerColor: '#333333',
                    primaryColor: '#333333',
                    secondaryColor: '#666666',
                    fontFamily: 'Arial, sans-serif',
                    footerText: 'Thank you for your business!',
                    footerSubtext: 'Kasa Family Management',
                    customCSS: '',
                    isDefault: false
                  })
                  setShowTemplateModal(true)
                }}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create New Template
              </button>
            </div>

            {templatesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <p className="mt-2 text-gray-600">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No templates yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first invoice or receipt template to get started.</p>
                <button
                  onClick={() => {
                    setEditingTemplate(null)
                    setTemplateFormData({
                      templateType: 'invoice',
                      templateName: 'Default',
                      headerLogo: '',
                      headerText: 'KASA',
                      headerSubtext: 'Family Management',
                      headerColor: '#333333',
                      primaryColor: '#333333',
                      secondaryColor: '#666666',
                      fontFamily: 'Arial, sans-serif',
                      footerText: 'Thank you for your business!',
                      footerSubtext: 'Kasa Family Management',
                      customCSS: '',
                      isDefault: false
                    })
                    setShowTemplateModal(true)
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Create Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800">{template.templateName}</h3>
                          {template.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 capitalize">{template.templateType}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          title="Edit template"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete template"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-medium">Header:</span> {template.headerText || 'N/A'}</p>
                      <p><span className="font-medium">Footer:</span> {template.footerText || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold">
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </h2>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitTemplate} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Template Type *</label>
                        <select
                          value={templateFormData.templateType}
                          onChange={(e) => setTemplateFormData({ ...templateFormData, templateType: e.target.value as 'invoice' | 'receipt' })}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        >
                          <option value="invoice">Invoice</option>
                          <option value="receipt">Receipt</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Template Name *</label>
                        <input
                          type="text"
                          value={templateFormData.templateName}
                          onChange={(e) => setTemplateFormData({ ...templateFormData, templateName: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Header Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Header Logo URL</label>
                          <input
                            type="text"
                            value={templateFormData.headerLogo}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, headerLogo: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Header Text
                              <span className="text-xs text-gray-500 ml-2">(use {`{{variableName}}`} for dynamic values)</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={templateFormData.headerText}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, headerText: e.target.value })}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="e.g., {{organizationName}}"
                              />
                              <VariablePicker
                                onSelectVariable={(varName) => setTemplateFormData({ ...templateFormData, headerText: templateFormData.headerText + varName })}
                                type="email"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Header Subtext
                              <span className="text-xs text-gray-500 ml-2">(use {`{{variableName}}`} for dynamic values)</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={templateFormData.headerSubtext}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, headerSubtext: e.target.value })}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="e.g., Invoice for {{familyName}}"
                              />
                              <VariablePicker
                                onSelectVariable={(varName) => setTemplateFormData({ ...templateFormData, headerSubtext: templateFormData.headerSubtext + varName })}
                                type="email"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Header Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={templateFormData.headerColor}
                              onChange={(e) => setTemplateFormData({ ...templateFormData, headerColor: e.target.value })}
                              className="h-10 w-20 border rounded"
                            />
                            <input
                              type="text"
                              value={templateFormData.headerColor}
                              onChange={(e) => setTemplateFormData({ ...templateFormData, headerColor: e.target.value })}
                              className="flex-1 border rounded-lg px-3 py-2"
                              placeholder="#333333"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Body Settings</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Primary Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={templateFormData.primaryColor}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, primaryColor: e.target.value })}
                                className="h-10 w-20 border rounded"
                              />
                              <input
                                type="text"
                                value={templateFormData.primaryColor}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, primaryColor: e.target.value })}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="#333333"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Secondary Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={templateFormData.secondaryColor}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, secondaryColor: e.target.value })}
                                className="h-10 w-20 border rounded"
                              />
                              <input
                                type="text"
                                value={templateFormData.secondaryColor}
                                onChange={(e) => setTemplateFormData({ ...templateFormData, secondaryColor: e.target.value })}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="#666666"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Font Family</label>
                          <input
                            type="text"
                            value={templateFormData.fontFamily}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, fontFamily: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Arial, sans-serif"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Footer Settings</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Footer Text</label>
                            <input
                              type="text"
                              value={templateFormData.footerText}
                              onChange={(e) => setTemplateFormData({ ...templateFormData, footerText: e.target.value })}
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Footer Subtext</label>
                            <input
                              type="text"
                              value={templateFormData.footerSubtext}
                              onChange={(e) => setTemplateFormData({ ...templateFormData, footerSubtext: e.target.value })}
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Advanced</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Custom CSS</label>
                          <textarea
                            value={templateFormData.customCSS}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, customCSS: e.target.value })}
                            rows={6}
                            className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                            placeholder="/* Custom CSS styles */"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={templateFormData.isDefault}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, isDefault: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <label htmlFor="isDefault" className="text-sm font-medium">
                            Set as default template for this type
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
                <p className="text-sm text-gray-600">Manage your account security and two-factor authentication</p>
              </div>
            </div>

            {currentUser ? (
              <TwoFactorAuth
                userId={currentUser._id || currentUser.id}
                twoFactorEnabled={currentUser.twoFactorEnabled || false}
                onUpdate={async () => {
                  // Refresh user data after 2FA update
                  try {
                    const token = localStorage.getItem('token')
                    const res = await fetch('/api/users/me', {
                      headers: token ? {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      } : {}
                    })
                    if (res.ok) {
                      const userData = await res.json()
                      setCurrentUser(userData)
                    }
                  } catch (error) {
                    console.error('Error refreshing user data:', error)
                  }
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">Loading user data...</div>
            )}
          </div>
        )}

            {/* Roles & Permissions Section - Salesforce-style table */}
            {activeSection === 'roles' && (userRole === 'admin' || userRole === 'super_admin') && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Roles & Permissions</h2>
                    <p className="text-gray-600">Manage user roles and their permissions</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRoleId(null)
                      setSelectedRolePermissions(new Set())
                      setShowRoleModal(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create Role
                  </button>
                </div>

                {/* Role Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                  <div className="flex gap-3">
                    <select
                      value={selectedRoleId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          loadRolePermissions(e.target.value)
                        } else {
                          setSelectedRoleId(null)
                          setSelectedRolePermissions(new Set())
                        }
                      }}
                      className="flex-1 max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select a role --</option>
                      {roles.map((role: any) => (
                        <option key={role._id} value={role._id}>
                          {role.displayName || role.name} {role.isSystem ? '(System)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

            {permissionsLoading || loadingRolePermissions ? (
              <div className="text-center py-8 text-gray-500">Loading permissions...</div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No permissions found. Please initialize permissions first.</p>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token')
                      const res = await fetch('/api/permissions/init', {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                      })
                      if (res.ok) {
                        showToast('Permissions initialized', 'success')
                        await fetchPermissions()
                      } else {
                        const error = await res.json()
                        showToast(error.error || 'Failed to initialize permissions', 'error')
                      }
                    } catch (error) {
                      showToast('Error initializing permissions', 'error')
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Initialize Permissions
                </button>
              </div>
            ) : !selectedRoleId ? (
              <div className="text-center py-8 text-gray-500">
                <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Please select a role to manage permissions</p>
              </div>
            ) : Object.keys(permissionsByModule).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No permissions found. Please initialize permissions first.</p>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token')
                      const res = await fetch('/api/permissions/init', {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                      })
                      if (res.ok) {
                        showToast('Permissions initialized', 'success')
                        fetchPermissions()
                      } else {
                        showToast('Failed to initialize permissions', 'error')
                      }
                    } catch (error) {
                      showToast('Error initializing permissions', 'error')
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Initialize Permissions
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase border-r border-gray-300 min-w-[220px]">
                        Object
                      </th>
                      <th colSpan={4} className="px-6 py-3 text-center text-xs font-semibold text-gray-900 uppercase bg-blue-50 border-b-2 border-gray-300">
                        Basic Access
                      </th>
                      <th colSpan={4} className="px-6 py-3 text-center text-xs font-semibold text-gray-900 uppercase bg-green-50 border-b-2 border-gray-300">
                        Extended Access
                      </th>
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-300"></th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-blue-50">Read</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-blue-50">Create</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-blue-50">Edit</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-blue-50">Delete</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-green-50">Export</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-green-50">Import</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-green-50">Refund</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-green-50">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(permissionsByModule).sort(([a], [b]) => a.localeCompare(b)).map(([module, modulePermissions]) => {
                      const viewPerm = modulePermissions.find(p => p.action === 'view')
                      const createPerm = modulePermissions.find(p => p.action === 'create')
                      const updatePerm = modulePermissions.find(p => p.action === 'update')
                      const deletePerm = modulePermissions.find(p => p.action === 'delete')
                      const exportPerm = modulePermissions.find(p => p.action === 'export')
                      const importPerm = modulePermissions.find(p => p.action === 'import')
                      const refundPerm = modulePermissions.find(p => p.action === 'refund')
                      const managePerm = modulePermissions.find(p => p.action === 'manage')

                      return (
                        <tr key={module} className="hover:bg-gray-50 transition-colors">
                          <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-300">
                            {getModuleDisplayName(module)}
                          </td>
                          {/* Basic Access */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {viewPerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(viewPerm.name)}
                                onChange={() => togglePermission(viewPerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {createPerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(createPerm.name)}
                                onChange={() => togglePermission(createPerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {updatePerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(updatePerm.name)}
                                onChange={() => togglePermission(updatePerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {deletePerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(deletePerm.name)}
                                onChange={() => togglePermission(deletePerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          {/* Extended Access */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {exportPerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(exportPerm.name)}
                                onChange={() => togglePermission(exportPerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {importPerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(importPerm.name)}
                                onChange={() => togglePermission(importPerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {refundPerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(refundPerm.name)}
                                onChange={() => togglePermission(refundPerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {managePerm ? (
                              <input
                                type="checkbox"
                                checked={selectedRolePermissions.has(managePerm.name)}
                                onChange={() => togglePermission(managePerm.name)}
                                disabled={savingPermissions}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {savingPermissions && (
                  <div className="mt-4 text-center text-sm text-gray-600 bg-yellow-50 py-2 border-t border-gray-200">
                    Saving permissions...
                  </div>
                )}
              </div>
            )}

            {/* Role Creation Modal */}
            <Modal
              isOpen={showRoleModal}
              onClose={() => {
                setShowRoleModal(false)
                setEditingRole(null)
                setRoleFormData({ name: '', displayName: '', description: '', permissions: [] })
              }}
              title={editingRole ? 'Edit Role' : 'Create New Role'}
            >
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    const token = localStorage.getItem('token')
                    const permissionIds = permissions
                      .filter(p => roleFormData.permissions.includes(p.name))
                      .map(p => p._id)

                    const url = editingRole ? `/api/roles/${editingRole._id}` : '/api/roles'
                    const method = editingRole ? 'PUT' : 'POST'

                    const res = await fetch(url, {
                      method,
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({
                        name: roleFormData.name,
                        displayName: roleFormData.displayName,
                        description: roleFormData.description,
                        permissions: permissionIds
                      })
                    })

                    if (res.ok) {
                      showToast(editingRole ? 'Role updated successfully' : 'Role created successfully', 'success')
                      setShowRoleModal(false)
                      setEditingRole(null)
                      setRoleFormData({ name: '', displayName: '', description: '', permissions: [] })
                      fetchRoles()
                    } else {
                      const error = await res.json()
                      showToast(error.error || 'Failed to save role', 'error')
                    }
                  } catch (error) {
                    showToast('Error saving role', 'error')
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name (ID)</label>
                  <input
                    type="text"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    placeholder="e.g., custom_admin"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (used internally)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={roleFormData.displayName}
                    onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                    placeholder="e.g., Custom Admin"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    placeholder="Describe this role's purpose..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Permissions</p>
                  <p className="text-xs text-gray-500 mb-3">Select permissions after creating the role</p>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleModal(false)
                      setEditingRole(null)
                      setRoleFormData({ name: '', displayName: '', description: '', permissions: [] })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        )}

        {/* Audit Logs Section */}
        {activeSection === 'auditLogs' && userRole === 'super_admin' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Audit Logs</h2>
              <p className="text-gray-600">View system activity and changes</p>
            </div>
            {auditLogsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No audit logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.slice(0, 20).map((log: any) => (
                      <tr key={log._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.userId?.firstName} {log.userId?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {log.entityType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link href="/audit-logs" className="text-blue-600 hover:underline">
                View all audit logs →
              </Link>
            </div>
          </div>
        )}

        {/* Sessions Section */}
        {activeSection === 'sessions' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Active Sessions</h2>
              <p className="text-gray-600">Manage active user sessions</p>
            </div>
            {sessionsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No active sessions</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.filter((s: any) => s.isActive && !s.revokedAt).map((session: any) => (
                  <div key={session._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">{session.ipAddress || 'Unknown'}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Revoke this session?')) {
                            const token = localStorage.getItem('token')
                            await fetch(`/api/sessions/${session._id}`, {
                              method: 'DELETE',
                              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                            })
                            fetchSessions()
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Last Activity: {new Date(session.lastActivity).toLocaleString()}</div>
                      <div>Expires: {new Date(session.expiresAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link href="/sessions" className="text-blue-600 hover:underline">
                View all sessions →
              </Link>
            </div>
          </div>
        )}

        {/* Family Tags Tab - Embedded from /family-tags page */}
        {activeSection === 'familyTags' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Family Tags</h2>
                <p className="text-gray-600">Create and manage tags for organizing families</p>
              </div>
              <button
                onClick={() => {
                  setEditingTag(null)
                  setTagFormData({ name: '', color: '#3b82f6', description: '' })
                  setShowTagModal(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                New Tag
              </button>
            </div>
            {tagsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : familyTags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TagIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No tags found. Create your first tag to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyTags.map((tag: any) => (
                  <div
                    key={tag._id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                        <h3 className="font-semibold text-gray-800">{tag.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTag(tag)
                            setTagFormData(tag)
                            setShowTagModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this tag?')) {
                              const token = localStorage.getItem('token')
                              await fetch(`/api/kasa/family-tags?id=${tag._id}`, {
                                method: 'DELETE',
                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                              })
                              fetchFamilyTags()
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {tag.description && <p className="text-sm text-gray-600 mt-2">{tag.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {showTagModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{editingTag ? 'Edit Tag' : 'Create New Tag'}</h2>
                    <button onClick={() => setShowTagModal(false)} className="p-2 hover:bg-gray-100 rounded">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    const token = localStorage.getItem('token')
                    const res = await fetch('/api/kasa/family-tags', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({ ...tagFormData, _id: editingTag?._id })
                    })
                    if (res.ok) {
                      setShowTagModal(false)
                      setEditingTag(null)
                      setTagFormData({ name: '', color: '#3b82f6', description: '' })
                      fetchFamilyTags()
                    }
                  }} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name *</label>
                      <input
                        type="text"
                        required
                        value={tagFormData.name}
                        onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={tagFormData.color}
                        onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                        className="w-full h-10 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={tagFormData.description}
                        onChange={(e) => setTagFormData({ ...tagFormData, description: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button type="button" onClick={() => setShowTagModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingTag ? 'Update Tag' : 'Create Tag'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Family Groups Tab - Embedded from /family-groups page */}
        {activeSection === 'familyGroups' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Family Groups</h2>
                <p className="text-gray-600">Organize families into groups</p>
              </div>
              <button
                onClick={() => {
                  setEditingGroup(null)
                  setGroupFormData({ name: '', color: '#3b82f6', description: '', families: [] })
                  setShowGroupModal(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                New Group
              </button>
            </div>
            {groupsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : familyGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No groups found. Create your first group to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyGroups.map((group: any) => (
                  <div
                    key={group._id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                        <h3 className="font-semibold text-gray-800">{group.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingGroup(group)
                            setGroupFormData(group)
                            setShowGroupModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this group?')) {
                              const token = localStorage.getItem('token')
                              await fetch(`/api/kasa/family-groups?id=${group._id}`, {
                                method: 'DELETE',
                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                              })
                              fetchFamilyGroups()
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {group.description && <p className="text-sm text-gray-600 mt-2 mb-2">{group.description}</p>}
                    <p className="text-xs text-gray-500">{group.families?.length || 0} families</p>
                  </div>
                ))}
              </div>
            )}
            {showGroupModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
                    <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-gray-100 rounded">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    const token = localStorage.getItem('token')
                    const res = await fetch('/api/kasa/family-groups', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({
                        ...groupFormData,
                        _id: editingGroup?._id,
                        families: groupFormData.families?.map((f: any) => f._id) || []
                      })
                    })
                    if (res.ok) {
                      setShowGroupModal(false)
                      setEditingGroup(null)
                      setGroupFormData({ name: '', color: '#3b82f6', description: '', families: [] })
                      fetchFamilyGroups()
                    }
                  }} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                      <input
                        type="text"
                        required
                        value={groupFormData.name}
                        onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={groupFormData.color}
                        onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                        className="w-full h-10 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={groupFormData.description}
                        onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Families</label>
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        {allFamilies.map((family: any) => {
                          const isSelected = groupFormData.families?.some((f: any) => f._id === family._id)
                          return (
                            <label key={family._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setGroupFormData({
                                      ...groupFormData,
                                      families: groupFormData.families?.filter((f: any) => f._id !== family._id) || []
                                    })
                                  } else {
                                    setGroupFormData({
                                      ...groupFormData,
                                      families: [...(groupFormData.families || []), { _id: family._id, name: family.name }]
                                    })
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{family.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingGroup ? 'Update Group' : 'Create Group'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Backup & Restore Tab - Embedded from /backup page */}
        {activeSection === 'backup' && (userRole === 'admin' || userRole === 'super_admin') && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Backup & Restore</h2>
              <p className="text-gray-600">Create backups and restore data</p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Create Backup</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
                    <select
                      value={backupType}
                      onChange={(e) => setBackupType(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="full">Full Backup</option>
                      <option value="families">Families Only</option>
                      <option value="payments">Payments Only</option>
                    </select>
                  </div>
                  <button
                    onClick={async () => {
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
                          const blob = new Blob([data.data], { type: 'application/json' })
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = data.filename
                          a.click()
                          window.URL.revokeObjectURL(url)
                          fetchBackups()
                        }
                      } finally {
                        setCreatingBackup(false)
                      }
                    }}
                    disabled={creatingBackup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    {creatingBackup ? 'Creating...' : 'Create Backup'}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Import Data</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select JSON File</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!importFile) return
                      setImporting(true)
                      try {
                        const text = await importFile.text()
                        const data = JSON.parse(text)
                        const token = localStorage.getItem('token')
                        await fetch('/api/kasa/backup/import', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify({ data, validateOnly: false })
                        })
                        setImportFile(null)
                      } finally {
                        setImporting(false)
                      }
                    }}
                    disabled={!importFile || importing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    {importing ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>
              {backupLoading ? (
                <div className="text-center py-8 text-gray-500">Loading backup history...</div>
              ) : backups.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Backup History</h3>
                  <div className="space-y-2">
                    {backups.slice(0, 10).map((backup: any) => (
                      <div key={backup._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">{backup.filename}</p>
                          <p className="text-sm text-gray-600">
                            {backup.backupType} • {new Date(backup.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                          backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </main>
  )
}
