'use client'

import { useState } from 'react'
import { DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Transaction {
  type: string
  date: string
  year: number
  family: string
  description: string
  amount: number
  notes: string
}

interface ReportSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  transactionCount: number
  paymentCount: number
  eventCount: number
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<{
    transactions: Transaction[]
    summary: ReportSummary
  } | null>(null)
  const [reportType, setReportType] = useState<'year' | 'range'>('year')
  const [year, setYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const generateReport = async () => {
    setLoading(true)
    try {
      let url = '/api/kasa/reports/pl?'
      if (reportType === 'year') {
        url += `year=${year}`
      } else {
        if (!startDate || !endDate) {
          alert('Please select both start and end dates')
          setLoading(false)
          return
        }
        url += `startDate=${startDate}&endDate=${endDate}`
      }

      const res = await fetch(url)
      const data = await res.json()
      
      if (res.ok) {
        setReportData(data)
      } else {
        alert(`Error: ${data.error || 'Failed to generate report'}`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    // Create CSV content
    const headers = ['Type', 'Date', 'Year', 'Family', 'Description', 'Amount', 'Notes']
    
    // Add summary section
    const summaryRows = [
      [],
      ['PROFIT & LOSS REPORT'],
      [`Generated: ${new Date().toLocaleString()}`],
      reportType === 'year' ? [`Year: ${year}`] : [`Period: ${startDate} to ${endDate}`],
      [],
      ['SUMMARY'],
      [`Total Income: $${reportData.summary.totalIncome.toLocaleString()}`],
      [`Total Expenses: $${reportData.summary.totalExpenses.toLocaleString()}`],
      [`Net Profit/Loss: $${reportData.summary.netProfit.toLocaleString()}`],
      [`Total Transactions: ${reportData.summary.transactionCount}`],
      [`Payments: ${reportData.summary.paymentCount}`],
      [`Events: ${reportData.summary.eventCount}`],
      [],
      ['DETAILED TRANSACTIONS'],
      headers
    ]

    // Add transaction rows
    const transactionRows = reportData.transactions.map(t => [
      t.type,
      new Date(t.date).toLocaleDateString(),
      t.year.toString(),
      t.family,
      t.description,
      t.amount.toFixed(2),
      t.notes || ''
    ])

    // Combine all rows
    const allRows = [...summaryRows, ...transactionRows]

    // Convert to CSV format
    const csvContent = allRows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const cellStr = String(cell || '')
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ).join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    const filename = reportType === 'year' 
      ? `P&L_Report_${year}.csv`
      : `P&L_Report_${startDate}_to_${endDate}.csv`
    
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Financial Reports</h1>
        </div>

        {/* Report Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generate P&L Report</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Period</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="year"
                    checked={reportType === 'year'}
                    onChange={(e) => setReportType(e.target.value as 'year' | 'range')}
                    className="mr-2"
                  />
                  By Year
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="range"
                    checked={reportType === 'range'}
                    onChange={(e) => setReportType(e.target.value as 'year' | 'range')}
                    className="mr-2"
                  />
                  Date Range
                </label>
              </div>
            </div>

            {reportType === 'year' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min="2000"
                  max="2100"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <CalendarIcon className="h-5 w-5" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Report Results</h2>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Export to CSV
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Income</div>
                <div className="text-2xl font-bold text-green-600">
                  ${reportData.summary.totalIncome.toLocaleString()}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600">
                  ${reportData.summary.totalExpenses.toLocaleString()}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${reportData.summary.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-sm text-gray-600">Net Profit/Loss</div>
                <div className={`text-2xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${reportData.summary.netProfit.toLocaleString()}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Transactions</div>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.summary.transactionCount}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.transactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'Income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.family}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

