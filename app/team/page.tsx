'use client'

import { useState, useEffect } from 'react'
import { UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function TeamPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'workspaces' | 'comments'>('workspaces')

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Team Collaboration
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === 'workspaces' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <UserGroupIcon className="h-5 w-5" />
              Workspaces
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === 'comments' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Comments
            </button>
          </div>

          {activeTab === 'workspaces' && (
            <div>
              <p className="text-gray-600">Workspace management coming soon...</p>
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <p className="text-gray-600">Comment system coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

