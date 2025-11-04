'use client'

import { useState, useRef } from 'react'
import { ChartBarIcon, DocumentTextIcon, SparklesIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function AnalyzePage() {
  const [text, setText] = useState('')
  const [analysisType, setAnalysisType] = useState('general')
  const [analysis, setAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze')
      return
    }

    setIsLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          type: analysisType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze text')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError('Please upload a text file (.txt)')
      return
    }

    try {
      const fileText = await file.text()
      setText(fileText)
    } catch (err) {
      setError('Failed to read file')
    }
  }

  return (
    <div className="min-h-screen mx-4 pb-6">
      {/* Header */}
      <div className="glass-panel rounded-xl p-6 mb-6 animate-scale-in border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ChartBarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              AI Analysis
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyze text with AI-powered insights, sentiment analysis, and more
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-panel rounded-xl p-6 border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Input Text</h2>
          
          {/* Analysis Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analysis Type
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="glass-panel w-full px-4 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100"
            >
              <option value="general">General Analysis</option>
              <option value="sentiment">Sentiment Analysis</option>
              <option value="insights">Text Insights</option>
              <option value="ai">AI-Powered Analysis</option>
              <option value="all">All Analysis Types</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="glass-button w-full px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-2"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              <span>Upload Text File</span>
            </button>
          </div>

          {/* Text Input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze... (or upload a .txt file)"
            className="glass-panel w-full h-64 px-4 py-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !text.trim()}
            className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                <span>Analyze Text</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 glass-panel bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="glass-panel rounded-xl p-6 border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Analysis Results</h2>
          
          {!analysis ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Enter text and click "Analyze Text" to see results
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {/* Sentiment Analysis */}
              {analysis.analysis?.sentiment && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Sentiment Analysis</h3>
                  <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    {analysis.analysis.sentiment.methods?.textblob && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">TextBlob:</p>
                        <p className="text-sm">
                          Sentiment: <span className="font-semibold">{analysis.analysis.sentiment.methods.textblob.sentiment}</span>
                          {' '}(Polarity: {analysis.analysis.sentiment.methods.textblob.polarity}, 
                          Subjectivity: {analysis.analysis.sentiment.methods.textblob.subjectivity})
                        </p>
                      </div>
                    )}
                    {analysis.analysis.sentiment.methods?.vader && (
                      <div>
                        <p className="text-sm font-medium mb-1">VADER:</p>
                        <p className="text-sm">
                          Sentiment: <span className="font-semibold">{analysis.analysis.sentiment.methods.vader.sentiment}</span>
                          {' '}(Compound: {analysis.analysis.sentiment.methods.vader.compound})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Text Insights */}
              {analysis.analysis?.text_insights && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Text Insights</h3>
                  <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Word Count:</p>
                        <p className="text-gray-600 dark:text-gray-400">{analysis.analysis.text_insights.word_count}</p>
                      </div>
                      <div>
                        <p className="font-medium">Character Count:</p>
                        <p className="text-gray-600 dark:text-gray-400">{analysis.analysis.text_insights.character_count}</p>
                      </div>
                      <div>
                        <p className="font-medium">Sentences:</p>
                        <p className="text-gray-600 dark:text-gray-400">{analysis.analysis.text_insights.sentence_count}</p>
                      </div>
                      <div>
                        <p className="font-medium">Reading Time:</p>
                        <p className="text-gray-600 dark:text-gray-400">{analysis.analysis.text_insights.reading_time_minutes || 'N/A'} min</p>
                      </div>
                    </div>
                    {analysis.analysis.text_insights.top_words && (
                      <div className="mt-4">
                        <p className="font-medium text-sm mb-2">Top Words:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.analysis.text_insights.top_words.map((word: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {analysis.analysis?.ai_analysis && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">AI-Powered Analysis</h3>
                  <div className="glass-panel p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {analysis.analysis.ai_analysis.ai_analysis || 'AI analysis unavailable'}
                    </p>
                  </div>
                </div>
              )}

              {analysis.note && (
                <div className="glass-panel bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg backdrop-blur-sm text-sm">
                  {analysis.note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

