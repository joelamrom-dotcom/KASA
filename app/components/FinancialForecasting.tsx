'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { CalendarIcon, CurrencyDollarIcon, ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

interface ProjectionData {
  startYear: number
  endYear: number
  totalProjectedRevenue: number
  monthlyProjections: Array<{
    year: number
    month: number
    date: string
    projectedRevenue: number
    memberCounts: {
      plan1: number
      plan2: number
      plan3: number
      plan4: number
    }
    lifecycleEvents: Array<{
      type: string
      memberName: string
      date: string
      amount?: number
    }>
    planChanges: Array<{
      memberName: string
      oldPlan: number
      newPlan: number
      date: string
    }>
  }>
  summary: {
    averageMonthlyRevenue: number
    peakRevenueMonth: any
    totalLifecycleEvents: number
    totalPlanChanges: number
  }
}

export default function FinancialForecasting() {
  const [loading, setLoading] = useState(true)
  const [projection, setProjection] = useState<ProjectionData | null>(null)
  const [years, setYears] = useState(5)
  const [cashFlow, setCashFlow] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'projection' | 'cashflow' | 'scenario'>('projection')

  useEffect(() => {
    fetchProjection()
    fetchCashFlow()
  }, [years])

  const fetchProjection = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/forecasting/projections?years=${years}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setProjection(data)
      }
    } catch (error) {
      console.error('Error fetching projection:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCashFlow = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/forecasting/cash-flow?months=12', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setCashFlow(data)
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!projection) {
    return <div className="text-center py-8 text-gray-500">No projection data available</div>
  }

  // Prepare chart data
  const chartData = projection.monthlyProjections.map(p => ({
    month: `${p.month}/${p.year}`,
    revenue: Math.round(p.projectedRevenue),
    plan1: p.memberCounts.plan1,
    plan2: p.memberCounts.plan2,
    plan3: p.memberCounts.plan3,
    plan4: p.memberCounts.plan4
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Forecasting</h2>
          <p className="text-gray-600">5-10 year projections based on member age progression</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Years:
            <select
              value={years}
              onChange={(e) => {
                setYears(parseInt(e.target.value))
              }}
              className="ml-2 border rounded-lg px-3 py-2"
            >
              <option value={5}>5 Years</option>
              <option value={7}>7 Years</option>
              <option value={10}>10 Years</option>
            </select>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projected Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(projection.totalProjectedRevenue)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(projection.summary.averageMonthlyRevenue)}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lifecycle Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {projection.summary.totalLifecycleEvents}
              </p>
            </div>
            <CalendarIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Plan Changes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {projection.summary.totalPlanChanges}
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projection')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projection'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Revenue Projection
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cashflow'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cash Flow
          </button>
        </nav>
      </div>

      {/* Projection Chart */}
      {activeTab === 'projection' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue Projection</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Projected Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cash Flow Chart */}
      {activeTab === 'cashflow' && cashFlow && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Cash Flow Forecast (12 Months)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cashFlow.monthlyCashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="projectedIncome" stroke="#10b981" strokeWidth={2} name="Projected Income" />
                <Line type="monotone" dataKey="netCashFlow" stroke="#3b82f6" strokeWidth={2} name="Net Cash Flow" />
                <Line type="monotone" dataKey="cumulativeCashFlow" stroke="#8b5cf6" strokeWidth={2} name="Cumulative" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {cashFlow.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(cashFlow.summary.totalIncome)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Net Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(cashFlow.summary.netCashFlow)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Avg Monthly Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(cashFlow.summary.averageMonthlyCashFlow)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

