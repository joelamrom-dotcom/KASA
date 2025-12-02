'use client'

import { useState, useEffect } from 'react'
import { UserGroupIcon, ChatBubbleLeftRightIcon, PlusIcon, AtSymbolIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

interface Workspace {
  _id: string
  name: string
  description?: string
  members: any[]
  createdBy: any
}

interface Comment {
  _id: string
  entityType: string
  entityId: string
  comment: string
  mentions: any[]
  createdBy: any
  createdAt: string
}

export default function TeamPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activeTab, setActiveTab] = useState<'workspaces' | 'comments'>('workspaces')
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '', members: [] as string[] })
  const [newComment, setNewComment] = useState({ entityType: 'family', entityId: '', comment: '', mentions: [] as string[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'workspaces') {
      fetchWorkspaces()
    } else {
      fetchComments()
    }
  }, [activeTab])

  const fetchWorkspaces = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/team/workspaces', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.workspaces || [])
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/team/comments', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkspace = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/team/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newWorkspace)
      })
      if (res.ok) {
        setShowWorkspaceModal(false)
        fetchWorkspaces()
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
    }
  }

  const createComment = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/team/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newComment)
      })
      if (res.ok) {
        setShowCommentModal(false)
        fetchComments()
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Team Collaboration
        </h1>

        <div className="bg-white rounded-lg shadow">
          <div className="flex gap-4 p-4 border-b">
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

          <div className="p-6">
            {activeTab === 'workspaces' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Workspaces</h2>
                  <button
                    onClick={() => setShowWorkspaceModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    New Workspace
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : workspaces.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No workspaces found</div>
                ) : (
                  <div className="space-y-4">
                    {workspaces.map((ws) => (
                      <div key={ws._id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">{ws.name}</h3>
                        {ws.description && <p className="text-gray-600 mb-3">{ws.description}</p>}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Members:</span>
                          <div className="flex gap-1">
                            {ws.members?.slice(0, 5).map((m: any, i: number) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                {m.name || m.email || 'Member'}
                              </span>
                            ))}
                            {ws.members?.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                +{ws.members.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Comments</h2>
                  <button
                    onClick={() => setShowCommentModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    New Comment
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No comments found</div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.createdBy?.name || 'User'}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{comment.comment}</p>
                            {comment.mentions && comment.mentions.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <AtSymbolIcon className="h-4 w-4 text-gray-400" />
                                {comment.mentions.map((m: any, i: number) => (
                                  <span key={i} className="text-sm text-blue-600">
                                    @{m.name || m.email}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create Workspace</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Member IDs (comma-separated)</label>
                <input
                  type="text"
                  value={newWorkspace.members.join(', ')}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, members: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="user1, user2, user3"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createWorkspace}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showCommentModal} onClose={() => setShowCommentModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Add Comment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entity Type</label>
                <select
                  value={newComment.entityType}
                  onChange={(e) => setNewComment({ ...newComment, entityType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="family">Family</option>
                  <option value="payment">Payment</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entity ID</label>
                <input
                  type="text"
                  value={newComment.entityId}
                  onChange={(e) => setNewComment({ ...newComment, entityId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comment</label>
                <textarea
                  value={newComment.comment}
                  onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mentions (User IDs, comma-separated)</label>
                <input
                  type="text"
                  value={newComment.mentions.join(', ')}
                  onChange={(e) => setNewComment({ ...newComment, mentions: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="user1, user2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
