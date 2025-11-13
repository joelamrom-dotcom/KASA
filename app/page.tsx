'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  BoltIcon,
  DocumentTextIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface DashboardStats {
  totalFamilies: number
  totalMembers: number
  totalIncome: number
  totalExpenses: number
  balance: number
}

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

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilies: 0,
    totalMembers: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'today' | 'overdue'>('all')

  useEffect(() => {
    fetchDashboardData()
    fetchTasksInline()
  }, [])
  
  useEffect(() => {
    fetchTasksInline()
  }, [taskFilter])
  
  const fetchTasksInline = async () => {
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

  const fetchDashboardData = async () => {
    try {
      // Fetch families
      const familiesRes = await fetch('/api/kasa/families')
      const families = await familiesRes.json()
      
      let calculationData = {
        calculatedIncome: 0,
        calculatedExpenses: 0,
        balance: 0
      }
      
      // Fetch current year calculation (handle 404 gracefully)
      const currentYear = new Date().getFullYear()
      const calcRes = await fetch(`/api/kasa/calculations?year=${currentYear}`)
      if (calcRes.ok) {
        calculationData = await calcRes.json()
      }
      
      setStats({
        totalFamilies: families.length || 0,
        totalMembers: families.reduce((sum: number, f: any) => sum + (f.memberCount || 0), 0),
        totalIncome: calculationData.calculatedIncome || 0,
        totalExpenses: calculationData.calculatedExpenses || 0,
        balance: calculationData.balance || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-white/20 rounded-xl w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white/40 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const overdueTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today && t.status !== 'completed'
  }).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Welcome back! Here's your financial overview</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Families"
            value={stats.totalFamilies}
            icon={UserGroupIcon}
            color="blue"
            trend={null}
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={UserGroupIcon}
            color="green"
            trend={null}
          />
          <StatCard
            title="Total Income"
            value={`$${stats.totalIncome.toLocaleString()}`}
            icon={CurrencyDollarIcon}
            color="emerald"
            trend="up"
          />
          <StatCard
            title="Balance"
            value={`$${stats.balance.toLocaleString()}`}
            icon={ChartBarIcon}
            color={stats.balance >= 0 ? "green" : "red"}
            trend={stats.balance >= 0 ? "up" : "down"}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tasks Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
                    <p className="text-sm text-gray-500">
                      {pendingTasks} pending • {overdueTasks} overdue
                    </p>
                  </div>
                </div>
                <Link
                  href="/tasks"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Task</span>
                </Link>
              </div>

              {/* Task Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: 'all', label: 'All Tasks' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'today', label: 'Due Today' },
                  { key: 'overdue', label: 'Overdue' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setTaskFilter(filter.key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      taskFilter === filter.key
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Tasks List */}
              {loadingTasks ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-500 mt-4">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-600 font-medium mb-2">No tasks found</p>
                  <Link href="/tasks" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                    Create your first task <span>→</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => {
                    const dueDate = new Date(task.dueDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isOverdue = dueDate < today && task.status !== 'completed'
                    const isDueToday = dueDate.toDateString() === today.toDateString()
                    
                    const priorityColors = {
                      low: 'bg-gray-100 text-gray-700 border-gray-200',
                      medium: 'bg-blue-50 text-blue-700 border-blue-200',
                      high: 'bg-orange-50 text-orange-700 border-orange-200',
                      urgent: 'bg-red-50 text-red-700 border-red-200'
                    }

                    const statusColors = {
                      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
                      completed: 'bg-green-50 text-green-700 border-green-200',
                      cancelled: 'bg-gray-50 text-gray-700 border-gray-200'
                    }

                    return (
                      <Link
                        key={task._id}
                        href="/tasks"
                        className={`block p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          isOverdue 
                            ? 'bg-red-50/50 border-red-200 hover:border-red-300' 
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium border ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium border ${statusColors[task.status]}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              {isDueToday && task.status !== 'completed' && (
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  Due Today
                                </span>
                              )}
                              {isOverdue && (
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                                  <ExclamationTriangleIcon className="h-3 w-3" />
                                  Overdue
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                Due: {dueDate.toLocaleDateString()}
                              </span>
                              {task.relatedFamilyId && (
                                <span className="flex items-center gap-1">
                                  <UserGroupIcon className="h-3 w-3" />
                                  {task.relatedFamilyId.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                  {tasks.length > 5 && (
                    <div className="text-center pt-4">
                      <Link href="/tasks" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                        View all {tasks.length} tasks <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Setup - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <BoltIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <ActionButton 
                  href="/families" 
                  label="Manage Families" 
                  icon={UserGroupIcon}
                  color="blue"
                />
                <ActionButton 
                  href="/calculations" 
                  label="View Calculations" 
                  icon={CalculatorIcon}
                  color="purple"
                />
                <ActionButton 
                  href="/statements" 
                  label="Generate Statements" 
                  icon={DocumentTextIcon}
                  color="green"
                />
                <ActionButton 
                  href="/analysis" 
                  label="View Analysis" 
                  icon={SparklesIcon}
                  color="pink"
                />
              </div>
            </div>

            {/* Quick Setup */}
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-blue-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Quick Setup</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Initialize default payment plans and lifecycle events to get started:
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/kasa/init', { method: 'POST' })
                    if (res.ok) {
                      alert('Default data initialized successfully!')
                      fetchDashboardData()
                    }
                  } catch (error) {
                    alert('Error initializing data')
                  }
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <SparklesIcon className="h-5 w-5" />
                Initialize Default Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  trend
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend?: 'up' | 'down' | null
}) {
  const colorConfigs = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    emerald: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200'
    },
    red: {
      gradient: 'from-red-500 to-pink-500',
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  }

  const config = colorConfigs[color as keyof typeof colorConfigs] || colorConfigs.blue

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 ${config.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.text} mb-1`}>{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {trend && (
              <div className={`${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                )}
              </div>
            )}
          </div>
        </div>
        <div className={`bg-gradient-to-br ${config.gradient} p-3 rounded-xl shadow-md`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className={`h-1 rounded-full ${config.bg} overflow-hidden`}>
        <div className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`} style={{ width: '100%' }}></div>
      </div>
    </div>
  )
}

function ActionButton({ 
  href, 
  label, 
  icon: Icon,
  color 
}: { 
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const colorConfigs = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    pink: 'from-pink-500 to-rose-500'
  }

  const gradient = colorConfigs[color as keyof typeof colorConfigs] || colorConfigs.blue

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className={`p-2 bg-gradient-to-br ${gradient} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </Link>
  )
}
