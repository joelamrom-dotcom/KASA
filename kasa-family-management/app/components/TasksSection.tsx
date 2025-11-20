'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

interface Task {
  _id: string
  title: string
  description?: string
  dueDate: string
  email: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  relatedFamilyId?: { _id: string; name: string }
  relatedMemberId?: { _id: string; firstName: string; lastName: string }
  emailSent: boolean
}

export default function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'today' | 'overdue'>('all')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    email: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    relatedFamilyId: '',
    relatedMemberId: '',
    notes: ''
  })
  const [families, setFamilies] = useState<any[]>([])
  const [familyMembers, setFamilyMembers] = useState<{ [familyId: string]: any[] }>({})

  useEffect(() => {
    fetchTasks()
    fetchFamilies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskFilter])

  useEffect(() => {
    if (families.length > 0) {
      fetchAllFamilyMembers()
    }
  }, [families])

  const fetchFamilies = async () => {
    try {
      const res = await fetch('/api/kasa/families')
      if (res.ok) {
        const data = await res.json()
        setFamilies(data)
      }
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const fetchAllFamilyMembers = async () => {
    try {
      const membersMap: { [familyId: string]: any[] } = {}
      await Promise.all(
        families.map(async (family) => {
          try {
            const res = await fetch(`/api/kasa/families/${family._id}/members`)
            if (res.ok) {
              const members = await res.json()
              membersMap[family._id] = members
            }
          } catch (error) {
            console.error(`Error fetching members for family ${family._id}:`, error)
          }
        })
      )
      setFamilyMembers(membersMap)
    } catch (error) {
      console.error('Error fetching family members:', error)
    }
  }

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      let url = '/api/kasa/tasks'
      if (taskFilter === 'today') {
        url += '?dueDate=today'
      } else if (taskFilter === 'overdue') {
        url += '?dueDate=overdue'
      } else if (taskFilter === 'pending') {
        url += '?status=pending'
      }
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setTasks(data || [])
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  return (
    <>
      {/* MINIMAL TEST - Should always render */}
      <div style={{ background: '#ff0000', color: '#ffffff', padding: '30px', marginBottom: '20px', fontSize: '32px', fontWeight: 'bold', textAlign: 'center' }}>
        🔴 RED TEST BOX - IF YOU SEE THIS, NEW CODE IS DEPLOYED
      </div>

      {/* Tasks Section */}
      <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6 border-4 border-red-500 bg-yellow-100" style={{ minHeight: '200px', position: 'relative', zIndex: 1 }}>
        <div className="bg-red-500 text-white p-2 mb-4 text-center font-bold">
          TASKS SECTION - IF YOU SEE THIS, THE SECTION IS RENDERING
        </div>
        <div className="text-xs text-gray-600 mb-2">
          Debug: loadingTasks={loadingTasks ? 'true' : 'false'}, tasks.length={tasks.length}, taskFilter={taskFilter}
        </div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">📋 Tasks Section</h2>
          <button
            onClick={() => {
              setTaskForm({
                title: '',
                description: '',
                dueDate: new Date().toISOString().split('T')[0],
                email: '',
                priority: 'medium',
                relatedFamilyId: '',
                relatedMemberId: '',
                notes: ''
              })
              setShowTaskModal(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Add Task
          </button>
        </div>

        {/* Task Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTaskFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              taskFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setTaskFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              taskFilter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setTaskFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              taskFilter === 'today' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Due Today
          </button>
          <button
            onClick={() => setTaskFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              taskFilter === 'overdue' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overdue
          </button>
        </div>

        {/* Tasks List */}
        {loadingTasks ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 glass rounded-xl border border-white/20">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueDate = new Date(task.dueDate)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const isOverdue = dueDate < today && task.status !== 'completed'
              const isDueToday = dueDate.toDateString() === today.toDateString()
              
              const priorityColors = {
                low: 'bg-gray-100 text-gray-800',
                medium: 'bg-blue-100 text-blue-800',
                high: 'bg-orange-100 text-orange-800',
                urgent: 'bg-red-100 text-red-800'
              }

              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                in_progress: 'bg-blue-100 text-blue-800',
                completed: 'bg-green-100 text-green-800',
                cancelled: 'bg-gray-100 text-gray-800'
              }

              return (
                <div
                  key={task._id}
                  className={`glass rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all ${
                    isOverdue ? 'border-red-300 bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {isDueToday && task.status !== 'completed' && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            Due Today
                          </span>
                        )}
                        {isOverdue && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            Overdue
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Due: {dueDate.toLocaleDateString()}</span>
                        <span>Email: {task.email}</span>
                        {task.relatedFamilyId && (
                          <span>Family: {task.relatedFamilyId.name}</span>
                        )}
                        {task.relatedMemberId && (
                          <span>Member: {task.relatedMemberId.firstName} {task.relatedMemberId.lastName}</span>
                        )}
                        {task.emailSent && (
                          <span className="text-green-600">✓ Email Sent</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {task.status !== 'completed' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/kasa/tasks/${task._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'completed' })
                              })
                              if (res.ok) {
                                fetchTasks()
                              }
                            } catch (error) {
                              console.error('Error updating task:', error)
                            }
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            try {
                              const res = await fetch(`/api/kasa/tasks/${task._id}`, {
                                method: 'DELETE'
                              })
                              if (res.ok) {
                                fetchTasks()
                              }
                            } catch (error) {
                              console.error('Error deleting task:', error)
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      <Modal 
        isOpen={showTaskModal} 
        title="Create Task" 
        onClose={() => setShowTaskModal(false)}
      >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                const res = await fetch('/api/kasa/tasks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...taskForm,
                    relatedFamilyId: taskForm.relatedFamilyId || undefined,
                    relatedMemberId: taskForm.relatedMemberId || undefined
                  })
                })
                if (res.ok) {
                  setShowTaskModal(false)
                  fetchTasks()
                  setTaskForm({
                    title: '',
                    description: '',
                    dueDate: new Date().toISOString().split('T')[0],
                    email: '',
                    priority: 'medium',
                    relatedFamilyId: '',
                    relatedMemberId: '',
                    notes: ''
                  })
                } else {
                  const error = await res.json()
                  alert(error.error || 'Failed to create task')
                }
              } catch (error) {
                console.error('Error creating task:', error)
                alert('Error creating task')
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Task description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                value={taskForm.email}
                onChange={(e) => setTaskForm({ ...taskForm, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="email@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Email will be sent on due date</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Related Family (Optional)</label>
              <select
                value={taskForm.relatedFamilyId}
                onChange={(e) => {
                  setTaskForm({ 
                    ...taskForm, 
                    relatedFamilyId: e.target.value,
                    relatedMemberId: ''
                  })
                }}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">None</option>
                {families.map((family) => (
                  <option key={family._id} value={family._id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>
            {taskForm.relatedFamilyId && (
              <div>
                <label className="block text-sm font-medium mb-1">Related Member (Optional)</label>
                <select
                  value={taskForm.relatedMemberId}
                  onChange={(e) => setTaskForm({ ...taskForm, relatedMemberId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {familyMembers[taskForm.relatedFamilyId]?.map((member: any) => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="Additional notes"
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Create Task
              </button>
            </div>
          </form>
        </Modal>
    </>
  )
}

