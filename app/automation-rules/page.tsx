'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import AutomationRuleBuilder from '@/app/components/AutomationRuleBuilder'
import VisualWorkflowBuilder from '@/app/components/VisualWorkflowBuilder'
import RuleTemplatesModal from '@/app/components/RuleTemplatesModal'

interface AutomationRule {
  _id: string
  name: string
  description?: string
  isActive: boolean
  trigger: {
    type: string
    config?: any
  }
  conditions: any[]
  actions: any[]
  executionCount: number
  lastExecutedAt?: string
  lastExecutionResult?: {
    success: boolean
    executedActions: number
    failedActions: number
  }
}

export default function AutomationRulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showVisualBuilder, setShowVisualBuilder] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/kasa/automation-rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return
    }

    try {
      const response = await fetch(`/api/kasa/automation-rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRules(rules.filter(r => r._id !== ruleId))
      } else {
        alert('Failed to delete rule')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert('Failed to delete rule')
    }
  }

  const handleToggleActive = async (rule: AutomationRule) => {
    try {
      const response = await fetch(`/api/kasa/automation-rules/${rule._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })

      if (response.ok) {
        const updated = await response.json()
        setRules(rules.map(r => r._id === rule._id ? updated : r))
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const handleTest = async (rule: AutomationRule) => {
    try {
      const response = await fetch(`/api/kasa/automation-rules/${rule._id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerData: {
            type: rule.trigger.type,
            data: {},
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Test executed! ${result.result.executed} rules executed, ${result.result.failed} failed.`)
        fetchRules() // Refresh to see updated execution count
      } else {
        alert('Test failed')
      }
    } catch (error) {
      console.error('Error testing rule:', error)
      alert('Test failed')
    }
  }

  const filteredRules = rules.filter(rule => {
    if (filter === 'active') return rule.isActive
    if (filter === 'inactive') return !rule.isActive
    return true
  })

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      payment_received: 'Payment Received',
      payment_overdue: 'Payment Overdue',
      member_added: 'Member Added',
      member_updated: 'Member Updated',
      member_age_changed: 'Member Age Changed',
      family_created: 'Family Created',
      family_updated: 'Family Updated',
      lifecycle_event_created: 'Lifecycle Event Created',
      task_created: 'Task Created',
      task_due: 'Task Due',
      statement_generated: 'Statement Generated',
      balance_threshold: 'Balance Threshold',
      scheduled: 'Scheduled',
    }
    return labels[triggerType] || triggerType
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
            <p className="text-gray-600 mt-1">Create and manage automation workflows</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Templates
            </button>
            <button
              onClick={() => {
                setEditingRule(null)
                setShowVisualBuilder(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Visual Builder
            </button>
            <button
              onClick={() => {
                setEditingRule(null)
                setShowBuilder(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({rules.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active ({rules.filter(r => r.isActive).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'inactive'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Inactive ({rules.filter(r => !r.isActive).length})
          </button>
        </div>

        {/* Rules List */}
        {filteredRules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No automation rules found</p>
            <button
              onClick={() => {
                setEditingRule(null)
                setShowBuilder(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First Rule
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRules.map((rule) => (
              <div
                key={rule._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{rule.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          rule.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-gray-600 mb-4">{rule.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Trigger:</span>{' '}
                        {getTriggerLabel(rule.trigger.type)}
                      </div>
                      {rule.conditions.length > 0 && (
                        <div>
                          <span className="font-medium">Conditions:</span> {rule.conditions.length}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Actions:</span> {rule.actions.length}
                      </div>
                      <div>
                        <span className="font-medium">Executions:</span> {rule.executionCount}
                      </div>
                      {rule.lastExecutedAt && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(rule.lastExecutedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {rule.lastExecutionResult && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        {rule.lastExecutionResult.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-gray-600">
                          Last run: {rule.lastExecutionResult.executedActions} succeeded,{' '}
                          {rule.lastExecutionResult.failedActions} failed
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleTest(rule)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Test rule"
                    >
                      <PlayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={rule.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {rule.isActive ? (
                        <PauseIcon className="h-5 w-5" />
                      ) : (
                        <PlayIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(rule)
                        setShowBuilder(true)
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit rule"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete rule"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <RuleTemplatesModal
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={(template) => {
              setShowTemplates(false)
              setEditingRule(template as any)
              setShowBuilder(true)
            }}
          />
        )}

        {/* Visual Workflow Builder */}
        {showVisualBuilder && (
          <VisualWorkflowBuilder
            onClose={() => setShowVisualBuilder(false)}
            onSave={(rule) => {
              setShowVisualBuilder(false)
              // Convert visual rule to form data and open builder
              setEditingRule(rule as any)
              setShowBuilder(true)
            }}
          />
        )}

        {/* Rule Builder Modal */}
        {showBuilder && (
          <AutomationRuleBuilder
            rule={editingRule}
            onClose={() => {
              setShowBuilder(false)
              setEditingRule(null)
            }}
            onSave={() => {
              setShowBuilder(false)
              setEditingRule(null)
              fetchRules()
            }}
          />
        )}
      </div>
    </div>
  )
}

