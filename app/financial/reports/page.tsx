'use client'

import { useState } from 'react'
import { ChartBarIcon, DocumentTextIcon, CurrencyDollarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function FinancialReportsPage() {
  const [activeReport, setActiveReport] = useState<'pl' | 'balance-sheet' | 'cash-flow' | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  const fetchReport = async (type: string) => {
    try {
      setLoading(true)
      setActiveReport(type as any)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      
      const res = await fetch(`/api/kasa/financial/${type}?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    if (!activeReport || !reportData) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/financial/${activeReport}/export?format=${format}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeReport}-${new Date().toISOString()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        a.click()
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Financial Reports
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => fetchReport('pl')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left"
          >
            <ChartBarIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Profit & Loss</h3>
            <p className="text-sm text-gray-600">Revenue and expenses summary</p>
          </button>

          <button
            onClick={() => fetchReport('balance-sheet')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left"
          >
            <DocumentTextIcon className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Balance Sheet</h3>
            <p className="text-sm text-gray-600">Assets, liabilities, and equity</p>
          </button>

          <button
            onClick={() => fetchReport('cash-flow')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Cash Flow</h3>
            <p className="text-sm text-gray-600">Cash inflows and outflows</p>
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">Loading report...</div>
        )}

        {reportData && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {activeReport === 'pl' && 'Profit & Loss Statement'}
                {activeReport === 'balance-sheet' && 'Balance Sheet'}
                {activeReport === 'cash-flow' && 'Cash Flow Statement'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export PDF
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export Excel
                </button>
              </div>
            </div>

            {activeReport === 'pl' && reportData.revenue && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-700">
                      ${reportData.revenue.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-700">
                      ${reportData.expenses.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Net Profit</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ${reportData.profit.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Margin: {reportData.profit.margin.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Revenue', value: reportData.revenue.total },
                      { name: 'Expenses', value: reportData.expenses.total },
                      { name: 'Profit', value: reportData.profit.total }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeReport === 'balance-sheet' && reportData.assets && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Assets</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ${reportData.assets.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Liabilities</div>
                    <div className="text-2xl font-bold text-orange-700">
                      ${reportData.liabilities.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Equity</div>
                    <div className="text-2xl font-bold text-green-700">
                      ${reportData.equity.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'cash-flow' && reportData.operating && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Operating</div>
                    <div className="text-xl font-bold text-blue-700">
                      ${reportData.operating.net.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Investing</div>
                    <div className="text-xl font-bold text-purple-700">
                      ${reportData.investing.net.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Financing</div>
                    <div className="text-xl font-bold text-green-700">
                      ${reportData.financing.net.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Net Cash Flow</div>
                    <div className="text-xl font-bold text-gray-700">
                      ${reportData.netCashFlow.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Operating', value: reportData.operating.net },
                      { name: 'Investing', value: reportData.investing.net },
                      { name: 'Financing', value: reportData.financing.net },
                      { name: 'Net', value: reportData.netCashFlow }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

