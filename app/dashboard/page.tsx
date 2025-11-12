'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import TasksSection from '@/app/components/TasksSection'

interface DashboardStats {
  totalFamilies: number
  totalMembers: number
  totalIncome: number
  totalExpenses: number
  balance: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilies: 0,
    totalMembers: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

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
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-white/20 rounded-xl w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 glass rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600">Overview of your financial management system</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Families"
            value={stats.totalFamilies}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={UserGroupIcon}
            color="green"
          />
          <StatCard
            title="Total Income"
            value={`$${stats.totalIncome.toLocaleString()}`}
            icon={CurrencyDollarIcon}
            color="emerald"
          />
          <StatCard
            title="Balance"
            value={`$${stats.balance.toLocaleString()}`}
            icon={ChartBarIcon}
            color={stats.balance >= 0 ? "green" : "red"}
          />
        </div>

        <TasksSection />

        <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6 border border-white/30">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton href="/families" label="Manage Families" />
            <ActionButton href="/calculations" label="View Calculations" />
            <ActionButton href="/statements" label="Generate Statements" />
          </div>
        </div>

        <div className="glass-strong rounded-2xl shadow-xl p-6 border border-white/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <h3 className="font-semibold mb-2 text-gray-800">Quick Setup</h3>
          <p className="text-sm text-gray-600 mb-4">
            Before using the system, initialize default payment plans and lifecycle events:
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Initialize Default Data
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const colorGradients = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    emerald: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-pink-500'
  }

  return (
    <div className="glass-strong rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-2 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`bg-gradient-to-br ${colorGradients[color as keyof typeof colorGradients]} p-4 rounded-xl shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block p-5 glass rounded-xl hover:glass-strong transition-all duration-200 text-center font-medium text-gray-700 hover:text-gray-900 transform hover:-translate-y-1 border border-white/20 hover:border-white/40"
    >
      {label}
    </a>
  )
}

