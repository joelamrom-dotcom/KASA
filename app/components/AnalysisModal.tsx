'use client'

import { useState } from 'react'
import { XMarkIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  title?: string
}

export default function AnalysisModal({ isOpen, onClose, data, title = 'Analysis' }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!data) return

    setIsLoading(true)
    setError('')
    setAnalysis(null)

    try {
      // Convert data to text for analysis
      let textToAnalyze = ''
      if (typeof data === 'string') {
        textToAnalyze = data
      } else if (typeof data === 'object') {
        // Convert object to readable text
        textToAnalyze = JSON.stringify(data, null, 2)
        // Also create a summary text
        const summaryParts: string[] = []
        Object.keys(data).forEach(key => {
          const value = data[key]
          if (typeof value === 'string' && value.length > 0) {
            summaryParts.push(`${key}: ${value}`)
          } else if (typeof value === 'number') {
            summaryParts.push(`${key}: ${value}`)
          } else if (typeof value === 'boolean') {
            summaryParts.push(`${key}: ${value ? 'Yes' : 'No'}`)
          }
        })
        textToAnalyze = summaryParts.join('. ') + '. ' + textToAnalyze
      }

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToAnalyze,
          data: Array.isArray(data) ? data : undefined,
          type: 'all',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      setAnalysis(result.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze data')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom glass-panel rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-white/20 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered analysis
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="glass-button p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {!analysis && !isLoading && (
              <div className="text-center py-8">
                <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Click "Analyze" to get AI-powered insights about this record
                </p>
                <button
                  onClick={handleAnalyze}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
                >
                  <SparklesIcon className="h-5 w-5" />
                  <span>Analyze</span>
                </button>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing data...</p>
              </div>
            )}

            {error && (
              <div className="glass-panel bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Sentiment Analysis */}
                {analysis.sentiment && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                      <ChartBarIcon className="h-5 w-5" />
                      <span>Sentiment Analysis</span>
                    </h4>
                    <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Sentiment:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          analysis.sentiment.sentiment === 'positive' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : analysis.sentiment.sentiment === 'negative'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {analysis.sentiment.sentiment}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Score:</p>
                          <p className="font-semibold">{analysis.sentiment.score}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Positive:</p>
                          <p className="font-semibold text-green-600">{analysis.sentiment.positive_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Negative:</p>
                          <p className="font-semibold text-red-600">{analysis.sentiment.negative_count}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Insights */}
                {analysis.text_insights && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Text Insights</h4>
                    <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Words:</p>
                          <p className="font-semibold">{analysis.text_insights.word_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Characters:</p>
                          <p className="font-semibold">{analysis.text_insights.character_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Sentences:</p>
                          <p className="font-semibold">{analysis.text_insights.sentence_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Reading Time:</p>
                          <p className="font-semibold">{analysis.text_insights.reading_time_minutes} min</p>
                        </div>
                      </div>
                      {analysis.text_insights.top_words && analysis.text_insights.top_words.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Top Keywords:</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.text_insights.top_words.slice(0, 10).map((item: any, idx: number) => (
                              <span 
                                key={idx} 
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs"
                              >
                                {item.word} ({item.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Analysis */}
                {analysis.data_analysis && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Data Analysis</h4>
                    <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      <pre className="text-xs overflow-x-auto bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                        {JSON.stringify(analysis.data_analysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {analysis.ai_analysis && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                      <SparklesIcon className="h-5 w-5" />
                      <span>AI-Powered Insights</span>
                      {analysis.ai_analysis.provider && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300">
                          {analysis.ai_analysis.provider}
                        </span>
                      )}
                    </h4>
                    <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {typeof analysis.ai_analysis === 'string' 
                          ? analysis.ai_analysis 
                          : analysis.ai_analysis?.ai_analysis || 'AI analysis unavailable'}
                      </p>
                      {analysis.ai_analysis?.provider === 'intelligent-fallback' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            💡 Tip: The AI service may be temporarily unavailable. Try refreshing the analysis in a few moments.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end">
            <button
              onClick={onClose}
              className="glass-button px-4 py-2 rounded-lg text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

