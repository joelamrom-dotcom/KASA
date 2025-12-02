'use client'

import { useState, useEffect } from 'react'
import { LinkIcon, XMarkIcon, ExclamationTriangleIcon, ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface DependencyNode {
  id: string
  label: string
  type: 'report' | 'dataSource'
}

interface DependencyEdge {
  from: string
  to: string
  type: 'depends_on' | 'used_by'
}

interface DependencyGraph {
  nodes: DependencyNode[]
  edges: DependencyEdge[]
}

interface ImpactAnalysis {
  sourceName: string
  changeType: string
  affectedReports: number
  affectedUsers: number
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  reports: any[]
  recommendations: string[]
}

interface ReportDependenciesViewProps {
  reportId: string
  onClose: () => void
}

export default function ReportDependenciesView({ reportId, onClose }: ReportDependenciesViewProps) {
  const [loading, setLoading] = useState(true)
  const [graph, setGraph] = useState<DependencyGraph | null>(null)
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null)
  const [analyzingSource, setAnalyzingSource] = useState('')
  const [changeType, setChangeType] = useState('field_removed')

  useEffect(() => {
    fetchDependencies()
  }, [reportId])

  const fetchDependencies = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/dependencies`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setGraph(data.dependencyGraph)
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeImpact = async () => {
    if (!analyzingSource) {
      alert('Please enter a data source name')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/reports/impact-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceName: analyzingSource,
          changeType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setImpactAnalysis(data.impact)
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to analyze impact'}`)
      }
    } catch (error) {
      console.error('Error analyzing impact:', error)
      alert('Failed to analyze impact')
    }
  }

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Dependencies & Impact Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Impact Analysis Section */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
              Impact Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                value={analyzingSource}
                onChange={(e) => setAnalyzingSource(e.target.value)}
                placeholder="Data source name (e.g., Payment, Family)"
                className="border rounded px-3 py-2 text-sm"
              />
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="field_removed">Field Removed</option>
                <option value="field_changed">Field Changed</option>
                <option value="model_removed">Model Removed</option>
                <option value="model_changed">Model Changed</option>
              </select>
              <button
                onClick={analyzeImpact}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Analyze Impact
              </button>
            </div>

            {impactAnalysis && (
              <div className={`border-2 rounded-lg p-4 ${getImpactColor(impactAnalysis.impactLevel)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold">Impact Level: {impactAnalysis.impactLevel.toUpperCase()}</h5>
                  <span className="text-sm">
                    {impactAnalysis.affectedReports} reports, {impactAnalysis.affectedUsers} users affected
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Affected Reports:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {impactAnalysis.reports.slice(0, 5).map((r: any, i: number) => (
                        <li key={i} className="text-sm">{r.reportName || r.reportId}</li>
                      ))}
                      {impactAnalysis.reports.length > 5 && (
                        <li className="text-sm">... and {impactAnalysis.reports.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {impactAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dependency Graph */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              Dependency Graph
            </h4>

            {loading ? (
              <div className="text-center py-8">Loading dependencies...</div>
            ) : graph && graph.nodes.length > 0 ? (
              <div className="border rounded-lg p-4 bg-white">
                {/* Visual representation */}
                <div className="space-y-3">
                  {graph.nodes.map((node) => {
                    const incomingEdges = graph.edges.filter(e => e.to === node.id)
                    const outgoingEdges = graph.edges.filter(e => e.from === node.id)
                    
                    return (
                      <div
                        key={node.id}
                        className={`p-3 rounded border-2 ${
                          node.type === 'report'
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{node.label}</div>
                            <div className="text-xs text-gray-500 capitalize">{node.type}</div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {incomingEdges.length > 0 && (
                              <span className="mr-3">← {incomingEdges.length} dependencies</span>
                            )}
                            {outgoingEdges.length > 0 && (
                              <span>→ {outgoingEdges.length} dependents</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Data Sources */}
                <div className="mt-4 pt-4 border-t">
                  <h5 className="font-medium mb-2">Data Sources</h5>
                  <div className="flex flex-wrap gap-2">
                    {graph.nodes
                      .filter(n => n.type === 'dataSource')
                      .map((node) => (
                        <span
                          key={node.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          {node.label}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Dependent Reports */}
                {graph.nodes.filter(n => n.type === 'report' && n.id !== reportId).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium mb-2">Related Reports</h5>
                    <div className="space-y-1">
                      {graph.nodes
                        .filter(n => n.type === 'report' && n.id !== reportId)
                        .map((node) => (
                          <div key={node.id} className="text-sm text-gray-600">
                            • {node.label}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No dependencies found.</p>
                <p className="text-sm mt-2">Dependencies are automatically analyzed when reports are saved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

