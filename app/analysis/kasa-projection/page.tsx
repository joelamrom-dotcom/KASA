'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartBarIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'

interface YearData {
  year: number
  isHistorical: boolean
  isProjected: boolean
  income: {
    planIncome: number
    extraDonation: number
    calculatedIncome: number
    totalPayments: number
  }
  expenses: {
    totalExpenses: number
    extraExpense: number
    calculatedExpenses: number
    lifecycleEvents: number
  }
  balance: {
    balance: number
    netIncome: number
  }
  cumulativeBalance: number
  events: {
    weddings: number
    barMitzvahs: number
    births: number
    totalEvents: number
    totalAmount: number
  }
  payments: {
    total: number
    count: number
    average: number
  }
}

interface ProjectionData {
  yearData: YearData[]
  averages: {
    avgIncome: number
    avgExpenses: number
    avgBalance: number
    avgWeddings: number
    avgBirths: number
    avgPayments: number
  }
  summary: {
    startYear: number
    endYear: number
    currentYear: number
    totalYears: number
    historicalYears: number
    projectedYears: number
  }
}

export default function KasaProjectionPage() {
  const [data, setData] = useState<ProjectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yearsAhead, setYearsAhead] = useState(10)
  const [showChat, setShowChat] = useState(false)
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProjection()
  }, [yearsAhead])

  const fetchProjection = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/kasa/analysis/kasa-projection?years=${yearsAhead}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch projection')
      }
      const projectionData: ProjectionData = await res.json()
      setData(projectionData)
    } catch (err: any) {
      console.error('Error fetching projection:', err)
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleChatQuery = async () => {
    if (!chatQuery.trim() || chatLoading) return

    setChatLoading(true)
    setChatAnswer(null)

    try {
      const res = await fetch('/api/kasa/analysis/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: chatQuery,
          analysisData: null // Will be fetched on server
        })
      })

      if (res.ok) {
        const data = await res.json()
        setChatAnswer(data.answer)
      } else {
        const errorData = await res.json()
        setChatAnswer(`Error: ${errorData.error || 'Failed to get answer'}`)
      }
    } catch (err: any) {
      setChatAnswer(`Error: ${err.message || 'Failed to process query'}`)
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatQuery()
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Kasa Year-by-Year Projection</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">Loading projection data...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Kasa Year-by-Year Projection</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <button
              onClick={fetchProjection}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Kasa Year-by-Year Projection</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No projection data available.</p>
          </div>
        </div>
      </main>
    )
  }

  // Prepare chart data
  const chartData = data.yearData.map(d => ({
    year: d.year,
    income: d.income.calculatedIncome,
    expenses: d.expenses.calculatedExpenses,
    netIncome: d.balance.netIncome,
    cumulativeBalance: d.cumulativeBalance,
    payments: d.payments.total,
    weddings: d.events.weddings,
    births: d.events.births,
    barMitzvahs: d.events.barMitzvahs,
    totalEvents: d.events.totalEvents,
    isHistorical: d.isHistorical,
    isProjected: d.isProjected
  }))

  const currentYear = new Date().getFullYear()

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Kasa Year-by-Year Projection</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive view of income, expenses, life events, and payments from {data.summary.startYear} to {data.summary.endYear}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={yearsAhead}
              onChange={(e) => setYearsAhead(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="5">5 years ahead</option>
              <option value="10">10 years ahead</option>
              <option value="15">15 years ahead</option>
              <option value="20">20 years ahead</option>
            </select>
            <button
              onClick={fetchProjection}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Annual Income</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(data.averages.avgIncome)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Annual Expenses</h3>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(data.averages.avgExpenses)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Net Income</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.averages.avgBalance)}</p>
          </div>
        </div>

        {/* Financial Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Financial Overview</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeBalance"
                fill="#3b82f6"
                fillOpacity={0.2}
                stroke="#3b82f6"
                name="Cumulative Balance"
              />
              <Bar
                yAxisId="left"
                dataKey="income"
                fill="#10b981"
                name="Income"
              />
              <Bar
                yAxisId="left"
                dataKey="expenses"
                fill="#ef4444"
                name="Expenses"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netIncome"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Net Income"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Life Events Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Life Events by Year</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="weddings" fill="#f59e0b" name="Weddings" />
              <Bar dataKey="births" fill="#3b82f6" name="Births" />
              <Bar dataKey="barMitzvahs" fill="#10b981" name="Bar Mitzvahs" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payments Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Payments by Year</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="payments"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Total Payments"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Year-by-Year Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Detailed Year-by-Year Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Income</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cumulative Balance</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payments</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weddings</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Births</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bar Mitzvahs</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((row) => (
                  <tr 
                    key={row.year}
                    className={row.isProjected ? 'bg-blue-50' : ''}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.year}
                      {row.isProjected && <span className="ml-2 text-xs text-blue-600">(Projected)</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(row.expenses)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                      <span className={row.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(row.netIncome)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                      <span className={row.cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(row.cumulativeBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {formatCurrency(row.payments)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {row.weddings}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {row.births}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {row.barMitzvahs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setShowChat(true)
          setTimeout(() => chatInputRef.current?.focus(), 100)
        }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Ask About Your Data</h3>
              </div>
              <button
                onClick={() => {
                  setShowChat(false)
                  setChatQuery('')
                  setChatAnswer(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatAnswer && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-2">Answer:</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{chatAnswer}</div>
                </div>
              )}
              
              {!chatAnswer && (
                <div className="text-center py-8 text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Ask questions about your financial data, projections, families, payments, and more.</p>
                  <div className="mt-4 text-xs text-gray-400 space-y-1">
                    <p className="font-medium mb-2">Example questions:</p>
                    <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                      <li>"How much was paid this year?"</li>
                      <li>"What's the total income for 2026?"</li>
                      <li>"Show me payment methods breakdown"</li>
                      <li>"How many families do we have?"</li>
                      <li>"What are the payments by year?"</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask questions about your data..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleChatQuery}
                  disabled={chatLoading || !chatQuery.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {chatLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      <span>Ask</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

