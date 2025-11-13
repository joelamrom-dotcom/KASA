'use client'

import { useState, useRef } from 'react'
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)

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

  const handleClose = () => {
    setChatQuery('')
    setChatAnswer(null)
    onClose()
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
                  <li>"Show me future projections"</li>
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
  )
}

