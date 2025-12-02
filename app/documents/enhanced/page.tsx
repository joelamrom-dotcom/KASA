'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, TagIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function EnhancedDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    fetchDocuments()
  }, [searchQuery, selectedCategory, selectedTags])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = '/api/kasa/documents/enhanced?'
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      url += params.toString()

      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['contract', 'agreement', 'form', 'invoice', 'receipt', 'statement', 'other']

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Enhanced Document Management
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-10 border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                placeholder="Enter tags (comma-separated)"
                className="w-full border rounded-lg px-3 py-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const tags = (e.currentTarget as HTMLInputElement).value.split(',').map(t => t.trim()).filter(Boolean)
                    setSelectedTags(tags)
                    ;(e.currentTarget as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No documents found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{doc.name}</h3>
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {doc.category}
                  </span>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex gap-1">
                      {doc.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Document
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

