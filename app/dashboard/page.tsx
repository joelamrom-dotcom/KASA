'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon, 
  BellIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  SparklesIcon,
  XMarkIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import AnalysisModal from '../components/AnalysisModal'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/Skeleton'
import { showToast } from '../components/Toast'
import Card3D from '../components/Card3D'
import ScreenshotPreview from '../components/ScreenshotPreview'
import Avatar3D from '../components/Avatar3D'
import Image3D from '../components/Image3D'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface Family {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

interface Activity {
  id: string
  userId: string
  type: string
  description: string
  metadata?: any
  createdAt: string
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)

  const fetchDashboardData = async (showNotification = false) => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch users with timeout
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const usersResponse = await fetch('/api/users', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`)
        }
        
        const usersData = await usersResponse.json()
        
        // Handle both formats: { data: [...], pagination: {...} } or [...]
        const usersArray = Array.isArray(usersData) ? usersData : (usersData.data || [])
        setUsers(usersArray)
        console.log(`Dashboard: Loaded ${usersArray.length} users`)
      } catch (error: any) {
        console.error('Users fetch error:', error)
        if (error.name === 'AbortError') {
          console.error('Users fetch timed out after 10 seconds')
          setError('Request timed out. Please check your connection.')
        } else {
          setError('Failed to load users. Please try refreshing.')
        }
        setUsers([])
      }

      // Fetch families - skip for now since it requires authentication
      setFamilies([])

      // Fetch activities with timeout
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const activitiesResponse = await fetch('/api/activities', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!activitiesResponse.ok) {
          throw new Error(`HTTP error! status: ${activitiesResponse.status}`)
        }
        
        const activitiesData = await activitiesResponse.json()
        const activitiesArray = Array.isArray(activitiesData) 
          ? activitiesData 
          : (activitiesData.activities || [])
        setActivities(activitiesArray)
        console.log(`Dashboard: Loaded ${activitiesArray.length} activities`)
      } catch (error: any) {
        console.error('Activities fetch error:', error)
        if (error.name === 'AbortError') {
          console.error('Activities fetch timed out after 10 seconds')
        }
        setActivities([])
      }

      if (showNotification) {
        showToast('Dashboard data refreshed successfully', 'success')
      }

    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch dashboard data'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUser(user)
        setIsAuthenticated(true)
        fetchDashboardData()
      } else {
        setIsAuthenticated(false)
        setLoading(false)
        // Redirect to login
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  // Calculate dashboard stats
  const totalUsers = users?.length || 0
  const activeUsers = users?.filter((user: User) => user.isActive)?.length || 0
  const totalFamilies = families?.length || 0
  const superAdmins = users?.filter((user: User) => user.role === 'super_admin')?.length || 0
  const familyAdmins = users?.filter((user: User) => user.role === 'family_admin')?.length || 0
  const members = users?.filter((user: User) => user.role === 'member')?.length || 0
  const verifiedUsers = users?.filter((user: User) => user.emailVerified)?.length || 0
  
  // Calculate growth rate (users added this month vs last month)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthUsers = users?.filter((user: User) => {
    const userDate = new Date(user.createdAt)
    return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear
  })?.length || 0
  
  const lastMonthUsers = users?.filter((user: User) => {
    const userDate = new Date(user.createdAt)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return userDate.getMonth() === lastMonth && userDate.getFullYear() === lastMonthYear
  })?.length || 0
  
  const growthRate = lastMonthUsers > 0 
    ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
    : thisMonthUsers > 0 ? '100' : '0'

  // Generate chart data from real data
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const currentMonth = new Date().getMonth()
    
    return months.map((month, index) => {
      const monthIndex = (currentMonth - 5 + index + 12) % 12
      const monthUsers = users?.filter((user: User) => {
        const userMonth = new Date(user.createdAt).getMonth()
        return userMonth === monthIndex
      })?.length || 0
      
      const monthFamilies = families?.filter((family: Family) => {
        const familyMonth = new Date(family.createdAt).getMonth()
        return familyMonth === monthIndex
      })?.length || 0
      
      return {
        name: month,
        users: monthUsers,
        families: monthFamilies
      }
    })
  }

  const chartData = generateChartData()
  
  // Role distribution data for pie chart
  const roleData = [
    { name: 'Super Admins', value: superAdmins, color: '#8b5cf6' },
    { name: 'Family Admins', value: familyAdmins, color: '#f59e0b' },
    { name: 'Members', value: members, color: '#3b82f6' },
  ].filter(item => item.value > 0)
  

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-700 dark:text-gray-300">Loading dashboard...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-700 dark:text-gray-300">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <div className="glass-panel mx-4 mt-6 mb-6 rounded-2xl px-6 py-4 animate-slide-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <button 
              onClick={() => fetchDashboardData(true)}
              className="glass-button p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:rotate-180"
              title="Refresh data"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-4 mb-6">
        <div className="glass-panel rounded-xl p-2 inline-flex space-x-2">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'users', name: 'Users', icon: UserGroupIcon },
            { id: 'families', name: 'Families', icon: PlusIcon },
            { id: 'settings', name: 'Settings', icon: CogIcon },
          ].map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 animate-slide-in ${
                activeTab === tab.id
                  ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/80 hover:to-purple-500/80 hover:scale-105'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <tab.icon className="h-4 w-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-4 pb-6">
        {activeTab === 'overview' && (
          <div className="px-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="glass-panel rounded-xl p-4 border border-red-200 dark:border-red-800/50 mb-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                  <button
                    onClick={() => {
                      setError('')
                      fetchDashboardData(true)
                    }}
                    className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { 
                    icon: UserGroupIcon, 
                    label: 'Total Users', 
                    value: totalUsers, 
                    subtitle: `${activeUsers} active • ${verifiedUsers} verified`,
                    color: 'from-blue-500 to-blue-600',
                    delay: 0
                  },
                  { 
                    icon: ChartBarIcon, 
                    label: 'Growth Rate', 
                    value: `${growthRate}%`, 
                    subtitle: `${thisMonthUsers} this month`,
                    color: 'from-green-500 to-green-600',
                    delay: 0.1
                  },
                  { 
                    icon: CogIcon, 
                    label: 'Family Admins', 
                    value: familyAdmins, 
                    subtitle: `${members} members`,
                    color: 'from-yellow-500 to-yellow-600',
                    delay: 0.2
                  },
                  { 
                    icon: BellIcon, 
                    label: 'Super Admins', 
                    value: superAdmins, 
                    subtitle: 'System administrators',
                    color: 'from-purple-500 to-purple-600',
                    delay: 0.3
                  },
                ].map((stat, index) => (
                  <Card3D 
                    key={stat.label}
                    gradient={`${stat.color}/20`}
                    delay={stat.delay}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${stat.delay}s` }}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mt-1">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stat.subtitle}</span>
                    </div>
                  </Card3D>
                ))}
              </div>
            )}

            {/* Screenshot Preview Section */}
            <div className="mt-8 mb-8 px-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
                Platform Overview
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="animate-fade-in">
                  <Image3D
                    alt="Dashboard Analytics"
                    width={400}
                    height={300}
                    className="w-full"
                    gradient="from-blue-500 via-cyan-500 to-blue-600"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Dashboard Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time insights and metrics</p>
                  </div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <Image3D
                    alt="User Management"
                    width={400}
                    height={300}
                    className="w-full"
                    gradient="from-purple-500 via-pink-500 to-purple-600"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">User Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive user administration</p>
                  </div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <Image3D
                    alt="Family System"
                    width={400}
                    height={300}
                    className="w-full"
                    gradient="from-green-500 via-emerald-500 to-green-600"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Family System</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Advanced family case management</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
              {/* Growth Chart */}
              <Card3D gradient="from-blue-500/20 to-purple-500/20" delay={0.4}>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">Growth Overview</h3>
                {loading ? (
                  <Skeleton className="h-80" />
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                        <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-gray-400" />
                        <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users" />
                        <Line type="monotone" dataKey="families" stroke="#10b981" strokeWidth={2} name="Families" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card3D>

              {/* Role Distribution */}
              <Card3D gradient="from-purple-500/20 to-pink-500/20" delay={0.5}>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">Role Distribution</h3>
                {loading ? (
                  <Skeleton className="h-80" />
                ) : roleData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No role data available
                  </div>
                )}
              </Card3D>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 px-4">
              <Card3D gradient="from-green-500/20 to-blue-500/20" delay={0.6}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                      Recent Activity
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Latest platform updates and events
                    </p>
                  </div>
                  <a href="/family-case" className="btn-primary inline-flex items-center px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Family Case Management
                  </a>
                </div>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} lines={1} className="h-16" />
                    ))}
                  </div>
                ) : users.length === 0 && families.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 items-center justify-center mb-4">
                      <ClockIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No recent activity</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start by registering users or creating families</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Recent Users */}
                    {users.slice(0, 5).map((user: User, index) => (
                      <div 
                        key={user.id} 
                        className="flex items-center space-x-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowViewModal(true)
                        }}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <Avatar3D 
                          name={`${user.firstName} ${user.lastName}`}
                          size={48}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">New user registered</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Recent Families */}
                    {families.slice(0, 3).map((family: Family, index) => (
                      <div 
                        key={family.id} 
                        className="flex items-center space-x-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
                        style={{ animationDelay: `${(users.length + index) * 0.05}s` }}
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <BuildingOfficeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">New family created</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{family.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(family.createdAt).toLocaleDateString()}
                          </span>
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card3D>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="px-4 sm:px-0">
            <Card3D gradient="from-blue-500/20 to-purple-500/20" delay={0}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    User Management
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage and monitor all platform users
                  </p>
                </div>
                <a href="/register" className="btn-primary inline-flex items-center px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add User
                </a>
              </div>
              
              {error && (
                <div className="mb-6 p-4 glass-panel rounded-xl border border-red-200 dark:border-red-800/50 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                    <button
                      onClick={() => {
                        setError('')
                        fetchDashboardData(true)
                      }}
                      className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
              
              {loading ? (
                <SkeletonTable rows={5} />
              ) : users.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 items-center justify-center mb-4">
                    <UserGroupIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No users found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start by registering a new user</p>
                  <a href="/register" className="btn-primary inline-flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First User
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      {users.map((user: User, index) => (
                        <tr 
                          key={user.id} 
                          className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 cursor-pointer transition-all duration-200"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowViewModal(true)
                          }}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                                {user.firstName[0]}{user.lastName[0]}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              user.isActive 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              <span className={`h-2 w-2 rounded-full mr-2 ${
                                user.isActive ? 'bg-green-500' : 'bg-red-500'
                              }`}></span>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {user.company || <span className="text-gray-400 dark:text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedUser(user)
                                  setShowViewModal(true)
                                }}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="View user details"
                              >
                                <EyeIcon className="h-4 w-4 mr-1.5" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `/users`
                                }}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Edit user"
                              >
                                <PencilIcon className="h-4 w-4 mr-1.5" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setAnalysisData(user)
                                  setShowAnalysisModal(true)
                                }}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Analyze user data"
                              >
                                <SparklesIcon className="h-4 w-4 mr-1.5" />
                                Analyze
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card3D>
          </div>
        )}

        {activeTab === 'families' && (
          <div className="px-4 sm:px-0">
            <Card3D gradient="from-green-500/20 to-blue-500/20" delay={0}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                    Family Management
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage family groups and members
                  </p>
                </div>
                <a href="/family-case" className="btn-primary inline-flex items-center px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Family Case Management
                </a>
              </div>
              <div className="overflow-x-auto rounded-xl">
                {loading ? (
                  <SkeletonTable rows={5} />
                ) : families.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 items-center justify-center mb-4">
                      <BuildingOfficeIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No families found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start by creating a new family</p>
                    <a href="/family-case" className="btn-primary inline-flex items-center">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Family
                    </a>
                  </div>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Family Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      {families.map((family: Family, index) => (
                        <tr key={family.id} className="group hover:bg-gradient-to-r hover:from-green-50/50 hover:to-blue-50/50 dark:hover:from-green-900/10 dark:hover:to-blue-900/10 transition-all duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{family.name}</div>
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300">
                            <div className="max-w-xs truncate" title={family.description}>
                              {family.description}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {new Date(family.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card3D>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="px-4 sm:px-0">
            <Card3D gradient="from-gray-500/20 to-slate-500/20" delay={0}>
              <div className="mb-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 dark:from-gray-400 dark:to-slate-400 bg-clip-text text-transparent">
                  Application Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Configure your platform settings and preferences
                </p>
              </div>
              <div className="space-y-6">
                <div className="glass-panel rounded-xl p-6 border border-white/10">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Application Name</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    defaultValue="AI SaaS Platform"
                    placeholder="Enter application name"
                  />
                </div>
                <div className="glass-panel rounded-xl p-6 border border-white/10">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">API Key</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="text" 
                      className="input-field flex-1" 
                      defaultValue="sk-..." 
                      readOnly 
                    />
                    <button className="glass-button px-4 py-3 rounded-lg text-sm font-semibold">
                      Copy
                    </button>
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-6 border border-white/10">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Environment</label>
                  <select className="input-field w-full">
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Development</option>
                  </select>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => showToast('Settings saved successfully', 'success')}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </Card3D>
          </div>
        )}
      </main>

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative glass-panel rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in border border-white/20 dark:border-white/10">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xl">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">User Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="glass-button p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 hover:rotate-90"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Content */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{selectedUser.firstName}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{selectedUser.lastName}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Company</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{selectedUser.company || <span className="text-gray-400 dark:text-gray-500">-</span>}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Role</label>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300">
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      selectedUser.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <span className={`h-2 w-2 rounded-full mr-2 ${
                        selectedUser.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Verified</label>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      selectedUser.emailVerified 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <span className={`h-2 w-2 rounded-full mr-2 ${
                        selectedUser.emailVerified ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border border-white/10">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Created</label>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={() => {
                    setAnalysisData(selectedUser)
                    setShowViewModal(false)
                    setShowAnalysisModal(true)
                  }}
                  className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Analyze This User
                </button>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      window.location.href = `/users`
                    }}
                    className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Go to Users Page
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl flex-1 sm:flex-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false)
          setAnalysisData(null)
        }}
        data={analysisData}
        title={analysisData ? `Analysis: ${analysisData.firstName} ${analysisData.lastName}` : 'Analysis'}
      />
    </div>
  )
}
