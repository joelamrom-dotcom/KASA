'use client'

import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, ClockIcon, FireIcon } from '@heroicons/react/24/outline'

interface SearchResult {
  _id: string
  type: string
  title: string
  subtitle?: string
  highlight?: string
}

export default function GlobalSearchEnhanced() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load search history and popular searches
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    setSearchHistory(history.slice(0, 5))
    fetchPopularSearches()
  }, [])

  useEffect(() => {
    if (query.length > 2) {
      fetchSuggestions()
      performSearch()
    } else {
      setResults([])
      setSuggestions([])
    }
  }, [query])

  const fetchPopularSearches = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/search/popular', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setPopularSearches(data.searches || [])
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/search/suggestions?q=${encodeURIComponent(query)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const performSearch = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/search/advanced?q=${encodeURIComponent(query)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setShowResults(true)

        // Save to history
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
        if (!history.includes(query)) {
          history.unshift(query)
          localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)))
          setSearchHistory(history.slice(0, 5))
        }
      }
    } catch (error) {
      console.error('Error performing search:', error)
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">{part}</mark>
      ) : part
    )
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search families, payments, members..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          {query.length === 0 && (
            <div className="p-4">
              {searchHistory.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {searchHistory.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(term)
                          performSearch()
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {popularSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FireIcon className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium text-gray-500">Popular Searches</span>
                  </div>
                  <div className="space-y-1">
                    {popularSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(term)
                          performSearch()
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {query.length > 0 && suggestions.length > 0 && (
            <div className="p-2 border-b">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(suggestion)
                    performSearch()
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {query.length > 0 && results.length > 0 && (
            <div className="p-2">
              {results.map((result) => (
                <div
                  key={result._id}
                  className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="font-medium text-sm">
                    {highlightText(result.title, query)}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 mt-1">
                      {result.subtitle}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {result.type}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length > 0 && results.length === 0 && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

