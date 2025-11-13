'use client'

<<<<<<< HEAD
import Link from 'next/link'
import { ArrowRightIcon, ChartBarIcon, CogIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline'
import ScreenshotPreview from './components/ScreenshotPreview'
import Card3D from './components/Card3D'
import Image3D from './components/Image3D'

export default function HomePage() {
  return (
    <div className="min-h-screen animate-fade-in lg:pl-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center animate-fade-in">
            <div className="inline-block mb-6">
              <div className="glass-panel px-6 py-2 rounded-full flex items-center space-x-2 animate-scale-in">
                <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Platform</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Build Amazing SaaS
              </span>
              <br />
              <span className="text-gray-900 dark:text-gray-100">Platforms</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Modern design, powerful features, and AI-driven insights. Everything you need to build and scale your SaaS application.
            </p>
            <div className="mt-10 flex justify-center space-x-4 animate-slide-in">
              <Link href="/register" className="btn-primary px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link href="/login" className="glass-button px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Previews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Platform Overview
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experience our modern interface with glass effects and smooth animations
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="animate-fade-in">
            <Image3D
              alt="Dashboard Analytics"
              width={600}
              height={400}
              className="w-full"
              gradient="from-blue-500 via-cyan-500 to-blue-600"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">Real-time insights and metrics</p>
            </div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Image3D
              alt="User Management"
              width={600}
              height={400}
              className="w-full"
              gradient="from-purple-500 via-pink-500 to-purple-600"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Comprehensive user administration</p>
            </div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Image3D
              alt="Family System"
              width={600}
              height={400}
              className="w-full"
              gradient="from-green-500 via-emerald-500 to-green-600"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Family System</h3>
              <p className="text-gray-600 dark:text-gray-400">Advanced family case management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to build and scale modern SaaS applications
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ChartBarIcon,
              title: 'Analytics Dashboard',
              description: 'Get real-time insights into your application performance and user behavior with beautiful charts and metrics.',
              gradient: 'from-blue-500/20 to-cyan-500/20',
              delay: 0
            },
            {
              icon: CogIcon,
              title: 'AI Automation',
              description: 'Automate repetitive tasks and workflows with intelligent AI assistance that learns from your patterns.',
              gradient: 'from-purple-500/20 to-pink-500/20',
              delay: 0.1
            },
            {
              icon: UserGroupIcon,
              title: 'Team Collaboration',
              description: 'Work together seamlessly with built-in collaboration tools, role-based permissions, and real-time updates.',
              gradient: 'from-green-500/20 to-blue-500/20',
              delay: 0.2
            },
          ].map((feature, index) => (
            <Card3D key={feature.title} gradient={feature.gradient} delay={feature.delay}>
              <div className="text-center">
                <div className={`inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient.replace('/20', '')} items-center justify-center shadow-lg mb-6 animate-float`} style={{ animationDelay: `${feature.delay}s` }}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card3D gradient="from-blue-500/30 to-purple-500/30" className="text-center p-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Start your free trial today and experience the future of SaaS platforms.
          </p>
          <Link href="/register" className="btn-primary px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl inline-flex items-center">
            Get Started
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </Card3D>
=======
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white rounded-lg border border-gray-200"></div>
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Welcome back! Here's your financial overview</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={UserGroupIcon}
          />
          <StatCard
            title="Total Income"
            value={`$${stats.totalIncome.toLocaleString()}`}
            icon={CurrencyDollarIcon}
          />
          <StatCard
            title="Balance"
            value={`$${stats.balance.toLocaleString()}`}
            icon={ChartBarIcon}
            isBalance={true}
            isPositive={stats.balance >= 0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tasks Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Tasks</h2>
                    <p className="text-sm text-gray-500">
                      {pendingTasks} pending • {overdueTasks} overdue
                    </p>
                  </div>
                </div>
                <Link
                  href="/tasks"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      taskFilter === filter.key
                        ? 'bg-gray-900 text-white'
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
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="text-gray-500 mt-4">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-600 font-medium mb-2">No tasks found</p>
                  <Link href="/tasks" className="text-gray-900 hover:text-gray-700 font-medium inline-flex items-center gap-1">
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
                        className={`block p-4 rounded-lg border transition-all ${
                          isOverdue 
                            ? 'bg-red-50/50 border-red-200 hover:border-red-300' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[task.status]}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              {isDueToday && task.status !== 'completed' && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  Due Today
                                </span>
                              )}
                              {isOverdue && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
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
                      <Link href="/tasks" className="text-gray-900 hover:text-gray-700 font-medium inline-flex items-center gap-1">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <BoltIcon className="h-6 w-6 text-gray-700" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <ActionButton 
                  href="/families" 
                  label="Manage Families" 
                  icon={UserGroupIcon}
                />
                <ActionButton 
                  href="/calculations" 
                  label="View Calculations" 
                  icon={CalculatorIcon}
                />
                <ActionButton 
                  href="/statements" 
                  label="Generate Statements" 
                  icon={DocumentTextIcon}
                />
                <ActionButton 
                  href="/analysis" 
                  label="View Analysis" 
                  icon={SparklesIcon}
                />
              </div>
            </div>

            {/* Quick Setup */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <SparklesIcon className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Quick Setup</h3>
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
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <SparklesIcon className="h-5 w-5" />
                Initialize Default Data
              </button>
            </div>
          </div>
        </div>
>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
      </div>
    </div>
  )
}
<<<<<<< HEAD
=======

function StatCard({ 
  title, 
  value, 
  icon: Icon,
  isBalance = false,
  isPositive = true
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  isBalance?: boolean
  isPositive?: boolean
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {isBalance && (
              <div className={`${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="h-6 w-6 text-gray-700" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ 
  href, 
  label, 
  icon: Icon
}: { 
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
    >
      <div className="p-2 bg-white rounded-lg group-hover:bg-gray-100 transition-colors">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <span className="font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </Link>
  )
}
>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
