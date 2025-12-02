'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon, ArrowDownTrayIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DocumentViewerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get('id')
  const [document, setDocument] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'view' | 'compare'>('view')

  useEffect(() => {
    if (documentId) {
      fetchDocument()
      fetchVersions()
    }
  }, [documentId])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/documents/${documentId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setDocument(data.document)
        setSelectedVersion(data.document)
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/documents/${documentId}/versions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    }
  }

  const downloadVersion = async (versionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/documents/${documentId}/versions/${versionId}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${document?.name || 'document'}-v${versionId}.pdf`
        a.click()
      }
    } catch (error) {
      console.error('Error downloading version:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Document not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">{document.name}</h1>
                <p className="text-sm text-gray-500">
                  {document.category} • Version {document.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadVersion(selectedVersion?._id || document._id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">Version History</h2>
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version._id}
                    onClick={() => setSelectedVersion(version)}
                    className={`p-3 rounded-lg cursor-pointer border ${
                      selectedVersion?._id === version._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">v{version.version}</span>
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </p>
                    {version.comments && (
                      <p className="text-xs text-gray-600 mt-1">{version.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {document.fileType?.startsWith('image/') ? (
                <img
                  src={document.filePath || document.fileUrl}
                  alt={document.name}
                  className="w-full h-auto"
                />
              ) : document.fileType === 'application/pdf' ? (
                <iframe
                  src={document.filePath || document.fileUrl}
                  className="w-full"
                  style={{ height: 'calc(100vh - 200px)' }}
                />
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-500">Preview not available for this file type</p>
                  <button
                    onClick={() => downloadVersion(document._id)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Download to view
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

