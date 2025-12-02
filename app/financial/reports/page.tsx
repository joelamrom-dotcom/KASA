'use client'

import { useState } from 'react'
import { ChartBarIcon, DocumentTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function FinancialReportsPage() {
  const [activeReport, setActiveReport] = useState<'pl' | 'balance' | 'cashflow' | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async (type: string) => {
    try {
      setLoading(true)
      setActiveReport(type as any)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/financial/${type}`, {
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
            <h2 className="text-2xl font-semibold mb-4">
              {activeReport === 'pl' && 'Profit & Loss Statement'}
              {activeReport === 'balance' && 'Balance Sheet'}
              {activeReport === 'cashflow' && 'Cash Flow Statement'}
            </h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

