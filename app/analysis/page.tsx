'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartBarIcon, CalendarIcon, UserGroupIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AnalysisResult {
  analysis_date: string
  years_ahead: number
  ml_used?: boolean
  analysis_system?: string
  children_analysis: {
    historical: { [year: number]: number }
    historical_births: { [year: number]: number }
    statistics: {
      average: number
      median: number
      min: number
      max: number
      trend: string
    }
    predictions: {
      [year: number]: {
        predicted: number
        range_min: number
        range_max: number
        confidence: string
      }
    }
  }
  weddings_analysis: {
    historical: { [year: number]: number }
    statistics: {
      average: number
      median: number
      total_historical: number
    }
    predictions: {
      [year: number]: {
        predicted: number
        range_min: number
        range_max: number
        confidence: string
      }
    }
  }
  stability_analysis: {
    current_stats: {
      total_families: number
      total_members: number
      avg_children_per_family: number
      families_with_children: number
    }
    historical_families: { [year: number]: number }
    predictions: {
      [year: number]: {
        total_families: number
        new_families: number
        avg_children_per_family: number
        stability_score: string
      }
    }
  }
}

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [yearsAhead, setYearsAhead] = useState(10)
  const [showChat, setShowChat] = useState(false)
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAnalysis()
  }, [yearsAhead])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/kasa/analysis/future-trends?years=${yearsAhead}`)
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch analysis')
      }
    } catch (err: any) {
      setError(err.message || 'Error loading analysis')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading analysis...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!analysis) {
    return null
  }

  const currentYear = new Date().getFullYear()
  const predictionYears = Array.from({ length: yearsAhead }, (_, i) => currentYear + i + 1)

  const handleChatQuery = async () => {
    if (!chatQuery.trim() || chatLoading || !analysis) return

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

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Future Trends Analysis</h1>
            {analysis.analysis_system && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">Analysis System:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.ml_used 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {analysis.ml_used ? '🤖 ' : '📊 '}
                  {analysis.analysis_system}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Years Ahead:</label>
            <select
              value={yearsAhead}
              onChange={(e) => setYearsAhead(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              <option value="5">5 years</option>
              <option value="10">10 years</option>
              <option value="15">15 years</option>
              <option value="20">20 years</option>
            </select>
            <button
              onClick={fetchAnalysis}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setShowChat(!showChat)
                setTimeout(() => chatInputRef.current?.focus(), 100)
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showChat 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Ask Questions
            </button>
          </div>
        </div>

        {/* AI Query Interface */}
        {showChat && (
          <div className="mb-8 bg-white rounded-lg shadow-lg border-2 border-purple-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Ask About Your Analysis</h3>
              </div>
              <button
                onClick={() => {
                  setShowChat(false)
                  setChatQuery('')
                  setChatAnswer(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask questions like: 'How much was paid this year?', 'What's the total income?', 'How many children are projected?', 'What's the wedding trend?'"
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleChatQuery}
                  disabled={chatLoading || !chatQuery.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              {chatAnswer && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium mb-2">Answer:</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{chatAnswer}</div>
                </div>
              )}
              <div className="mt-4 text-xs text-gray-500">
                <p className="font-medium mb-1">Example questions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>"How much was paid this year?"</li>
                  <li>"What's the total income?"</li>
                  <li>"Show me payment methods breakdown"</li>
                  <li>"How many children are projected for next year?"</li>
                  <li>"What's the trend in weddings?"</li>
                  <li>"How many families do we have?"</li>
                  <li>"What are the payments by year?"</li>
                  <li>"Show me future projections"</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Current Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Families</div>
            <div className="text-2xl font-bold">{analysis.stability_analysis.current_stats.total_families}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Members</div>
            <div className="text-2xl font-bold">{analysis.stability_analysis.current_stats.total_members}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Avg Children/Family</div>
            <div className="text-2xl font-bold">{analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Stability Trend</div>
            <div className="text-2xl font-bold capitalize">{analysis.children_analysis.statistics.trend}</div>
          </div>
        </div>

        {/* Children Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Children Projections</h2>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Historical Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-gray-500">Average</div>
                <div className="text-xl font-bold">{analysis.children_analysis.statistics.average.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Median</div>
                <div className="text-xl font-bold">{analysis.children_analysis.statistics.median.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Min</div>
                <div className="text-xl font-bold">{analysis.children_analysis.statistics.min}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Max</div>
                <div className="text-xl font-bold">{analysis.children_analysis.statistics.max}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Trend</div>
                <div className="text-xl font-bold capitalize">{analysis.children_analysis.statistics.trend}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Year</th>
                  <th className="text-right p-2">Predicted</th>
                  <th className="text-right p-2">Range (Min - Max)</th>
                  <th className="text-center p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictionYears.map((year) => {
                  const pred = analysis.children_analysis.predictions[year]
                  if (!pred) return null
                  return (
                    <tr key={year} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{year}</td>
                      <td className="p-2 text-right font-bold text-blue-600">{pred.predicted}</td>
                      <td className="p-2 text-right text-gray-600">{pred.range_min} - {pred.range_max}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          pred.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          pred.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pred.confidence}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weddings Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Weddings Projections</h2>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Historical Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Average per Year</div>
                <div className="text-xl font-bold">{analysis.weddings_analysis.statistics.average.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Median</div>
                <div className="text-xl font-bold">{analysis.weddings_analysis.statistics.median.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Historical</div>
                <div className="text-xl font-bold">{analysis.weddings_analysis.statistics.total_historical}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Year</th>
                  <th className="text-right p-2">Predicted</th>
                  <th className="text-right p-2">Range (Min - Max)</th>
                  <th className="text-center p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictionYears.map((year) => {
                  const pred = analysis.weddings_analysis.predictions[year]
                  if (!pred) return null
                  return (
                    <tr key={year} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{year}</td>
                      <td className="p-2 text-right font-bold text-purple-600">{pred.predicted}</td>
                      <td className="p-2 text-right text-gray-600">{pred.range_min} - {pred.range_max}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          pred.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          pred.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pred.confidence}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Family Stability Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold">Family Stability & Growth</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Year</th>
                  <th className="text-right p-2">Total Families</th>
                  <th className="text-right p-2">New Families</th>
                  <th className="text-right p-2">Avg Children/Family</th>
                  <th className="text-center p-2">Stability Score</th>
                </tr>
              </thead>
              <tbody>
                {predictionYears.map((year) => {
                  const pred = analysis.stability_analysis.predictions[year]
                  if (!pred) return null
                  return (
                    <tr key={year} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{year}</td>
                      <td className="p-2 text-right font-bold">{pred.total_families}</td>
                      <td className="p-2 text-right text-green-600">+{pred.new_families}</td>
                      <td className="p-2 text-right">{pred.avg_children_per_family.toFixed(1)}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pred.stability_score === 'high' ? 'bg-green-100 text-green-800' :
                          pred.stability_score === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pred.stability_score.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>
                Analysis generated on {new Date(analysis.analysis_date).toLocaleString()}
              </span>
              {analysis.analysis_system && (
                <span className="text-xs text-gray-500">
                  Using: <strong>{analysis.analysis_system}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

