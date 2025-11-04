'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [usersResult, setUsersResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testUsersAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsersResult({ status: response.status, data })
    } catch (error) {
      setUsersResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Debug Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test API Endpoints</h2>
            
            <div className="space-y-4">
              <div>
                <button
                  onClick={testUsersAPI}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Users API'}
                </button>
                {usersResult && (
                  <div className="mt-2 p-4 bg-gray-100 rounded-md">
                    <h3 className="font-semibold">Users API Result:</h3>
                    <pre className="text-sm overflow-auto">{JSON.stringify(usersResult, null, 2)}</pre>
                  </div>
                )}
              </div>


            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-x-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</a>
              <a href="/register" className="text-blue-600 hover:text-blue-800">Register</a>

              <a href="/test-db" className="text-blue-600 hover:text-blue-800">Test DB</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
