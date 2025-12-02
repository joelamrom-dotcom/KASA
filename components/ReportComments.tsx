'use client'

import { useState, useEffect } from 'react'
import { ChatBubbleLeftRightIcon, XMarkIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Comment {
  _id: string
  comment: string
  userId: { firstName: string; lastName: string; email: string }
  cellReference?: { rowIndex: number; fieldName: string }
  isGeneral: boolean
  parentCommentId?: string
  resolved: boolean
  resolvedBy?: { firstName: string; lastName: string }
  createdAt: string
}

interface ReportCommentsProps {
  reportId: string
  onClose: () => void
}

export default function ReportComments({ reportId, onClose }: ReportCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isGeneral, setIsGeneral] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [reportId])

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
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

  const addComment = async () => {
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          comment: newComment,
          isGeneral,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([data.comment, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const resolveComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${reportId}/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })

      if (res.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Error resolving comment:', error)
    }
  }

  const generalComments = comments.filter(c => c.isGeneral && !c.parentCommentId)
  const cellComments = comments.filter(c => !c.isGeneral && !c.parentCommentId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Report Comments</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Comment */}
          <div className="mb-4 border rounded-lg p-4 bg-gray-50">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border rounded px-3 py-2 text-sm mb-2"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isGeneral}
                  onChange={(e) => setIsGeneral(e.target.checked)}
                />
                General comment
              </label>
              <button
                onClick={addComment}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Add Comment
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet.</p>
              <p className="text-sm mt-2">Be the first to add a comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* General Comments */}
              {generalComments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">General Comments</h4>
                  <div className="space-y-3">
                    {generalComments.map((comment) => (
                      <div
                        key={comment._id}
                        className={`border rounded-lg p-3 ${
                          comment.resolved ? 'bg-gray-50 opacity-60' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm">
                              {comment.userId.firstName} {comment.userId.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {!comment.resolved && (
                            <button
                              onClick={() => resolveComment(comment._id)}
                              className="text-green-600 hover:text-green-800"
                              title="Mark as resolved"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                        {comment.resolved && comment.resolvedBy && (
                          <div className="text-xs text-gray-500 mt-2">
                            Resolved by {comment.resolvedBy.firstName} {comment.resolvedBy.lastName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cell Comments */}
              {cellComments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Cell Comments</h4>
                  <div className="space-y-3">
                    {cellComments.map((comment) => (
                      <div
                        key={comment._id}
                        className={`border rounded-lg p-3 ${
                          comment.resolved ? 'bg-gray-50 opacity-60' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm">
                              {comment.userId.firstName} {comment.userId.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {comment.cellReference && (
                                <>Cell: {comment.cellReference.fieldName} (Row {comment.cellReference.rowIndex + 1}) • </>
                              )}
                              {new Date(comment.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {!comment.resolved && (
                            <button
                              onClick={() => resolveComment(comment._id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

