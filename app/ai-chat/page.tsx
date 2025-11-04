'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/react/24/solid'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    try {
      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])

      // Show note if using fallback (but don't show as error)
      if (data.note) {
        console.log('AI Note:', data.note)
        // Clear any errors since we got a response
        setError('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response'
      setError(errorMessage)
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen mx-4 pb-6">
      {/* Header */}
      <div className="glass-panel rounded-xl p-6 mb-6 animate-scale-in border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                AI Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Free AI Models - No API key needed! Ask me anything!
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="glass-button px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center space-x-2"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-panel rounded-xl shadow-2xl border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 min-h-[600px] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 animate-float">
                <SparklesIcon className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Start a Conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Ask me anything! I can help with coding, business advice, technical questions, and more.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  'Explain React hooks',
                  'Write a Python function',
                  'Business strategy tips',
                  'Database design best practices',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="glass-panel px-4 py-3 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 animate-slide-in border border-gray-200/50 dark:border-gray-700/50"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'glass-panel bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <SparklesIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </p>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs font-bold">
                          {typeof window !== 'undefined' && localStorage.getItem('user')
                            ? JSON.parse(localStorage.getItem('user') || '{}').firstName?.[0] || 'U'
                            : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass-panel bg-white/50 dark:bg-gray-700/50 rounded-2xl px-6 py-4 border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 animate-slide-in">
            <div className="glass-panel bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">{error}</p>
              {error.includes('API key') && (
                <div className="text-xs mt-2 opacity-80 space-y-1">
                  <p className="text-green-300">Good news: No API key needed! This uses completely free AI models.</p>
                  <p className="mt-1">If models are loading, wait a moment and try again. Free AI models may take a few seconds to initialize.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1 glass-panel rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '200px',
                  height: 'auto',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="glass-button h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PaperAirplaneIconSolid className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Powered by Free AI Models (Hugging Face) • 
            <span className="text-green-600 dark:text-green-400">100% Free, No API Key Required!</span>
          </p>
        </div>
      </div>
    </div>
  )
}

