'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline'

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
          </div>
        </div>

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

        <div className="mt-6 text-sm text-gray-500 italic">
          Analysis generated on {new Date(analysis.analysis_date).toLocaleString()}
        </div>
      </div>
    </main>
  )
}

