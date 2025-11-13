'use client'

import { useState, useRef } from 'react'
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const chatInputRef = useRef<HTMLInputElement>(null)

  const checkIfReportRequest = (query: string): boolean => {
    const queryLower = query.toLowerCase()
    return (
      queryLower.includes('report') || 
      (queryLower.includes('export') && queryLower.includes('data')) ||
      (queryLower.includes('download') && (queryLower.includes('famil') || queryLower.includes('member') || queryLower.includes('payment') || queryLower.includes('event')))
    )
  }

  const generateDataReport = async (query: string) => {
    try {
      const res = await fetch('/api/kasa/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Download the CSV file
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', data.filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Show success message with record counts
        const counts = []
        if (data.recordCount.families !== undefined) counts.push(`${data.recordCount.families} families`)
        if (data.recordCount.totalMembers !== undefined) counts.push(`${data.recordCount.totalMembers} members`)
        if (data.recordCount.payments !== undefined) counts.push(`${data.recordCount.payments} payments`)
        if (data.recordCount.events !== undefined) counts.push(`${data.recordCount.events} events`)
        
        setChatAnswer(`Report generated successfully!\n\n${counts.join('\n')}\n\nFile downloaded: ${data.filename}`)
      } else {
        const errorData = await res.json()
        setChatAnswer(`Error generating report: ${errorData.error || 'Failed to generate report'}`)
      }
    } catch (err: any) {
      setChatAnswer(`Error: ${err.message || 'Failed to generate report'}`)
    }
  }

  const handleChatQuery = async () => {
    if (!chatQuery.trim() || chatLoading) return

    const queryToProcess = chatQuery.trim() // Save the query before clearing
    setChatLoading(true)
    setChatAnswer(null)
    setChatQuery('') // Clear input immediately after starting

    // Check if this is a report request
    if (checkIfReportRequest(queryToProcess)) {
      await generateDataReport(queryToProcess)
      setChatLoading(false)
      return
    }

    // Otherwise, handle as regular chat query
    try {
      const res = await fetch('/api/kasa/analysis/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryToProcess,
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

  const handleClose = () => {
    setChatQuery('')
    setChatAnswer(null)
    setShowReportDialog(false)
    setReportTitle('')
    onClose()
  }

  const downloadReport = (title: string, question: string, answer: string) => {
    // Create CSV content
    const csvRows = [
      ['Report Title', title],
      ['Generated Date', new Date().toLocaleString()],
      [],
      ['Question', question],
      [],
      ['Answer', answer],
      [],
      ['Note', 'This report was generated from an AI conversation.']
    ]

    // Convert to CSV format (escape quotes and wrap in quotes if contains comma, quote, or newline)
    const csvContent = csvRows.map(row => {
      if (row.length === 0) return ''
      return row.map(cell => {
        const cellStr = String(cell || '')
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    }).join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Sanitize filename (remove special characters)
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `Report_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleGenerateReport = () => {
    if (!chatQuery || !chatAnswer || !reportTitle.trim()) {
      alert('Please provide a report title')
      return
    }

    // Auto-download the report (no database saving)
    downloadReport(reportTitle.trim(), chatQuery, chatAnswer)
    setShowReportDialog(false)
    setReportTitle('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Ask About Your Data</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatAnswer && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-blue-600 font-medium">Answer:</div>
                <button
                  onClick={async () => {
                    // Check if this should be a data report or conversation report
                    if (checkIfReportRequest(chatQuery)) {
                      // Generate data-based report
                      await generateDataReport(chatQuery)
                    } else {
                      // Generate conversation-based report
                      const autoTitle = chatQuery.length > 50 
                        ? chatQuery.substring(0, 50) + '...'
                        : chatQuery
                      setReportTitle(autoTitle)
                      setShowReportDialog(true)
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Generate Report"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Generate Report
                </button>
              </div>
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
                  <li>"Show me future projections"</li>
                  <li>"I need a report from all families and their members"</li>
                  <li>"Generate a report with all data"</li>
                  <li>"Export payments report"</li>
                  <li>"Download events report"</li>
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

      {/* Report Generation Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Title *</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="text-gray-600 mb-1"><strong>Question:</strong></div>
                  <div className="text-gray-700 mb-3">{chatQuery}</div>
                  <div className="text-gray-600 mb-1"><strong>Answer Preview:</strong></div>
                  <div className="text-gray-700 text-xs line-clamp-3">{chatAnswer?.substring(0, 150)}...</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReportDialog(false)
                      setReportTitle('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={!reportTitle.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    <span>Download CSV Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

