'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface AutomationRule {
  _id?: string
  name: string
  description?: string
  isActive: boolean
  trigger: {
    type: string
    config?: any
  }
  conditions: any[]
  actions: any[]
}

interface AutomationRuleBuilderProps {
  rule?: AutomationRule | null
  onClose: () => void
  onSave: () => void
}

const TRIGGER_TYPES = [
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'payment_overdue', label: 'Payment Overdue' },
  { value: 'payment_plan_changed', label: 'Payment Plan Changed' },
  { value: 'member_added', label: 'Member Added' },
  { value: 'member_updated', label: 'Member Updated' },
  { value: 'member_deleted', label: 'Member Deleted' },
  { value: 'member_age_changed', label: 'Member Age Changed' },
  { value: 'member_birthday', label: 'Member Birthday' },
  { value: 'family_created', label: 'Family Created' },
  { value: 'family_updated', label: 'Family Updated' },
  { value: 'family_deleted', label: 'Family Deleted' },
  { value: 'family_balance_changed', label: 'Family Balance Changed' },
  { value: 'lifecycle_event_created', label: 'Lifecycle Event Created' },
  { value: 'lifecycle_event_updated', label: 'Lifecycle Event Updated' },
  { value: 'withdrawal_created', label: 'Withdrawal Created' },
  { value: 'recurring_payment_created', label: 'Recurring Payment Created' },
  { value: 'recurring_payment_processed', label: 'Recurring Payment Processed' },
  { value: 'recurring_payment_failed', label: 'Recurring Payment Failed' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_due', label: 'Task Due' },
  { value: 'statement_generated', label: 'Statement Generated' },
  { value: 'statement_sent', label: 'Statement Sent' },
  { value: 'invoice_generated', label: 'Invoice Generated' },
  { value: 'document_uploaded', label: 'Document Uploaded' },
  { value: 'note_added', label: 'Note Added' },
  { value: 'reminder_sent', label: 'Reminder Sent' },
  { value: 'balance_threshold', label: 'Balance Threshold' },
  { value: 'scheduled', label: 'Scheduled' },
]

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_push_notification', label: 'Send Push Notification' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_task', label: 'Update Task' },
  { value: 'create_notification', label: 'Create Notification' },
  { value: 'update_payment_plan', label: 'Update Payment Plan' },
  { value: 'update_recurring_payment', label: 'Update Recurring Payment' },
  { value: 'create_lifecycle_event', label: 'Create Lifecycle Event' },
  { value: 'update_lifecycle_event', label: 'Update Lifecycle Event' },
  { value: 'create_withdrawal', label: 'Create Withdrawal' },
  { value: 'update_family', label: 'Update Family' },
  { value: 'update_member', label: 'Update Member' },
  { value: 'add_family_note', label: 'Add Family Note' },
  { value: 'add_family_tag', label: 'Add Family Tag' },
  { value: 'remove_family_tag', label: 'Remove Family Tag' },
  { value: 'generate_statement', label: 'Generate Statement' },
  { value: 'send_statement', label: 'Send Statement' },
  { value: 'generate_invoice', label: 'Generate Invoice' },
  { value: 'send_invoice', label: 'Send Invoice' },
  { value: 'create_payment_link', label: 'Create Payment Link' },
  { value: 'create_document', label: 'Create Document' },
  { value: 'update_family_balance', label: 'Update Family Balance' },
  { value: 'archive_family', label: 'Archive Family' },
  { value: 'restore_family', label: 'Restore Family' },
  { value: 'export_data', label: 'Export Data' },
  { value: 'create_audit_log', label: 'Create Audit Log' },
  { value: 'webhook', label: 'Call Webhook' },
]

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_or_equal', label: 'Greater or Equal' },
  { value: 'less_or_equal', label: 'Less or Equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
]

const CONDITION_FIELDS = [
  { value: 'family.balance', label: 'Family Balance' },
  { value: 'family.name', label: 'Family Name' },
  { value: 'family.email', label: 'Family Email' },
  { value: 'member.age', label: 'Member Age' },
  { value: 'member.firstName', label: 'Member First Name' },
  { value: 'payment.amount', label: 'Payment Amount' },
  { value: 'payment.type', label: 'Payment Type' },
]

export default function AutomationRuleBuilder({ rule, onClose, onSave }: AutomationRuleBuilderProps) {
  const [formData, setFormData] = useState<AutomationRule>({
    name: '',
    description: '',
    isActive: true,
    trigger: {
      type: 'payment_received',
      config: {},
    },
    conditions: [],
    actions: [],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (rule) {
      setFormData(rule)
    }
  }, [rule])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Rule name is required')
      return
    }

    if (formData.actions.length === 0) {
      setError('At least one action is required')
      return
    }

    setError('')
    setSaving(true)

    try {
      const url = rule?._id
        ? `/api/kasa/automation-rules/${rule._id}`
        : '/api/kasa/automation-rules'
      const method = rule?._id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save rule')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        {
          field: 'family.balance',
          operator: 'greater_than',
          value: '',
          logicalOperator: 'AND',
        },
      ],
    })
  }

  const updateCondition = (index: number, updates: any) => {
    const conditions = [...formData.conditions]
    conditions[index] = { ...conditions[index], ...updates }
    setFormData({ ...formData, conditions })
  }

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    })
  }

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        {
          type: 'send_email',
          config: {},
          order: formData.actions.length,
        },
      ],
    })
  }

  const updateAction = (index: number, updates: any) => {
    const actions = [...formData.actions]
    actions[index] = { ...actions[index], ...updates }
    setFormData({ ...formData, actions })
  }

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    })
  }

  const renderActionConfig = (action: any, index: number) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                value={action.config.to || 'family'}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, to: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="family">Family Email</option>
                <option value="admin">Admin Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={action.config.subject || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, subject: e.target.value },
                  })
                }
                placeholder="e.g., Thank you for your payment!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={action.config.body || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, body: e.target.value },
                  })
                }
                placeholder="Use {{family.name}} for family name, {{payment.amount}} for payment amount, etc."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'send_sms':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <select
                value={action.config.phoneNumber || 'family'}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, phoneNumber: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="family">Family Phone</option>
                <option value="admin">Admin Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={action.config.message || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, message: e.target.value },
                  })
                }
                placeholder="SMS message text"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'create_task':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input
                type="text"
                value={action.config.taskTitle || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, taskTitle: e.target.value },
                  })
                }
                placeholder="e.g., Follow up with {{family.name}}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={action.config.taskDescription || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, taskDescription: e.target.value },
                  })
                }
                rows={3}
                placeholder="Task description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="text"
                  value={action.config.taskDueDate || ''}
                  onChange={(e) =>
                    updateAction(index, {
                      config: { ...action.config, taskDueDate: e.target.value },
                    })
                  }
                  placeholder="e.g., +7 days or 2024-12-31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={action.config.taskPriority || 'medium'}
                  onChange={(e) =>
                    updateAction(index, {
                      config: { ...action.config, taskPriority: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee Email *</label>
              <select
                value={action.config.taskAssignee || 'admin'}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, taskAssignee: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="admin">Admin</option>
                <option value="family">Family</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Or enter specific email address</p>
              <input
                type="email"
                value={action.config.taskAssigneeEmail || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, taskAssigneeEmail: e.target.value },
                  })
                }
                placeholder="specific@email.com (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
              />
            </div>
          </div>
        )

      case 'create_notification':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={action.config.notificationMessage || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, notificationMessage: e.target.value },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={action.config.notificationType || 'info'}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, notificationType: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        )

      case 'add_family_note':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={action.config.note || action.config.message || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, note: e.target.value },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={action.config.category || 'automation'}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, category: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'add_family_tag':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
              <input
                type="text"
                value={action.config.tagName || action.config.tag || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, tagName: e.target.value },
                  })
                }
                placeholder="e.g., VIP, Priority, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color (optional)</label>
              <input
                type="color"
                value={action.config.color || '#3b82f6'}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, color: e.target.value },
                  })
                }
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'remove_family_tag':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
            <input
              type="text"
              value={action.config.tagName || action.config.tag || ''}
              onChange={(e) =>
                updateAction(index, {
                  config: { ...action.config, tagName: e.target.value },
                })
              }
              placeholder="Tag to remove"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )

      case 'create_payment_link':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={action.config.amount || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, amount: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={action.config.description || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, description: e.target.value },
                  })
                }
                placeholder="Payment request description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
              <input
                type="number"
                value={action.config.maxUses || 1}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, maxUses: parseInt(e.target.value) || 1 },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'create_withdrawal':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={action.config.amount || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, amount: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={action.config.reason || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, reason: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Date</label>
              <input
                type="text"
                value={action.config.withdrawalDate || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, withdrawalDate: e.target.value },
                  })
                }
                placeholder="e.g., +7 days or 2024-12-31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'update_task':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task ID (optional, uses trigger data if not provided)</label>
              <input
                type="text"
                value={action.config.taskId || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, taskId: e.target.value },
                  })
                }
                placeholder="Leave empty to use task from trigger"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={action.config.status || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, status: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">No change</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={action.config.priority || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, priority: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">No change</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )

      case 'send_push_notification':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={action.config.title || action.config.notificationTitle || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, title: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={action.config.message || action.config.notificationMessage || ''}
                onChange={(e) =>
                  updateAction(index, {
                    config: { ...action.config, message: e.target.value },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      default:
        return <p className="text-sm text-gray-500">Configuration for this action type coming soon</p>
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Send thank you email after payment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of what this rule does"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Trigger */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When should this rule run?
              </label>
              <select
                value={formData.trigger.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trigger: { ...formData.trigger, type: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {TRIGGER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conditions (Optional)</h3>
              <button
                onClick={addCondition}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Condition
              </button>
            </div>
            {formData.conditions.length === 0 ? (
              <p className="text-sm text-gray-500">No conditions - rule will always execute when triggered</p>
            ) : (
              <div className="space-y-4">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
                          <select
                            value={condition.field}
                            onChange={(e) => updateCondition(index, { field: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            {CONDITION_FIELDS.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, { operator: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            {CONDITION_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                          <input
                            type="text"
                            value={condition.value || ''}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Combine With</label>
                          <select
                            value={condition.logicalOperator || 'AND'}
                            onChange={(e) => updateCondition(index, { logicalOperator: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actions *</h3>
              <button
                onClick={addAction}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Action
              </button>
            </div>
            {formData.actions.length === 0 ? (
              <p className="text-sm text-gray-500">Add at least one action</p>
            ) : (
              <div className="space-y-4">
                {formData.actions.map((action, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, { type: e.target.value, config: {} })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {ACTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeAction(index)}
                        className="ml-4 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-3">{renderActionConfig(action, index)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="border-t pt-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Rule is active</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

