'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, CheckCircleIcon, ClockIcon, XCircleIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

interface ApprovalStep {
  approverId: string
  approverEmail?: string
  status: 'pending' | 'approved' | 'rejected' | 'delegated'
  comments?: string
  approvedAt?: Date
}

interface Workflow {
  _id: string
  entityType: string
  entityId: string
  action: string
  steps: ApprovalStep[]
  currentStep: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  createdAt: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [newWorkflow, setNewWorkflow] = useState({
    entityType: 'payment',
    entityId: '',
    action: 'approve',
    approvers: [] as string[]
  })

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/workflows/approvals', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/workflows/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newWorkflow)
      })
      if (res.ok) {
        setShowCreateModal(false)
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
    }
  }

  const approveStep = async (workflowId: string, stepIndex: number) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/workflows/approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          workflowId,
          stepIndex,
          action: 'approve'
        })
      })
      if (res.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error approving workflow:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Approval Workflows
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Workflow
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No workflows found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Workflow
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {workflow.action} - {workflow.entityType}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(workflow.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    workflow.status === 'approved' ? 'bg-green-100 text-green-700' :
                    workflow.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {workflow.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {workflow.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        index === workflow.currentStep ? 'border-blue-500 bg-blue-50' :
                        index < workflow.currentStep ? 'border-green-500 bg-green-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {step.status === 'approved' ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : step.status === 'rejected' ? (
                          <XCircleIcon className="h-6 w-6 text-red-600" />
                        ) : (
                          <ClockIcon className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{step.approverEmail || 'Approver'}</span>
                          {index === workflow.currentStep && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Current</span>
                          )}
                        </div>
                        {step.comments && (
                          <p className="text-sm text-gray-600 mt-1">{step.comments}</p>
                        )}
                      </div>
                      {index === workflow.currentStep && workflow.status === 'pending' && (
                        <button
                          onClick={() => approveStep(workflow._id, index)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create Approval Workflow</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entity Type</label>
                <select
                  value={newWorkflow.entityType}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, entityType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="payment_plan">Payment Plan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entity ID</label>
                <input
                  type="text"
                  value={newWorkflow.entityId}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, entityId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter entity ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <select
                  value={newWorkflow.action}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, action: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="approve">Approve</option>
                  <option value="refund">Refund</option>
                  <option value="change_plan">Change Plan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Approvers (User IDs, comma-separated)</label>
                <input
                  type="text"
                  value={newWorkflow.approvers.join(', ')}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, approvers: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="user1, user2, user3"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createWorkflow}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
