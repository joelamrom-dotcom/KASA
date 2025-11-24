'use client'

import { useState, useCallback } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface Node {
  id: string
  type: 'trigger' | 'condition' | 'action'
  label: string
  data: any
  position: { x: number; y: number }
}

interface AutomationRule {
  trigger: {
    type: string
    config?: any
  }
  conditions: any[]
  actions: any[]
}

interface VisualWorkflowBuilderProps {
  onSave: (rule: AutomationRule) => void
  onClose: () => void
  initialNodes?: Node[]
}

const TRIGGER_NODES = [
  { type: 'payment_received', label: 'Payment Received', color: 'bg-green-500' },
  { type: 'member_added', label: 'Member Added', color: 'bg-blue-500' },
  { type: 'family_created', label: 'Family Created', color: 'bg-purple-500' },
  { type: 'task_completed', label: 'Task Completed', color: 'bg-yellow-500' },
  { type: 'payment_overdue', label: 'Payment Overdue', color: 'bg-red-500' },
]

const ACTION_NODES = [
  { type: 'send_email', label: 'Send Email', color: 'bg-indigo-500' },
  { type: 'send_sms', label: 'Send SMS', color: 'bg-pink-500' },
  { type: 'create_task', label: 'Create Task', color: 'bg-orange-500' },
  { type: 'create_notification', label: 'Create Notification', color: 'bg-cyan-500' },
  { type: 'add_family_tag', label: 'Add Tag', color: 'bg-teal-500' },
]

export default function VisualWorkflowBuilder({ onSave, onClose, initialNodes = [] }: VisualWorkflowBuilderProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  const addNode = useCallback((type: 'trigger' | 'action', nodeType: string, label: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      label,
      data: { nodeType },
      position: {
        x: type === 'trigger' ? 100 : 500,
        y: 100 + nodes.filter(n => n.type === type).length * 120,
      },
    }
    setNodes([...nodes, newNode])
  }, [nodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }, [nodes, selectedNode])

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, position } : n))
  }, [nodes])

  const handleSave = () => {
    // Convert visual nodes to automation rule format
    const triggerNode = nodes.find(n => n.type === 'trigger')
    const conditionNodes = nodes.filter(n => n.type === 'condition')
    const actionNodes = nodes.filter(n => n.type === 'action').sort((a, b) => a.position.x - b.position.x)

    if (!triggerNode || actionNodes.length === 0) {
      alert('Please add at least one trigger and one action')
      return
    }

    const rule = {
      trigger: {
        type: triggerNode.data.nodeType,
        config: triggerNode.data.config || {},
      },
      conditions: conditionNodes.map(n => n.data),
      actions: actionNodes.map((n, index) => ({
        type: n.data.nodeType,
        config: n.data.config || {},
        order: index,
      })),
    }

    onSave(rule)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Visual Workflow Builder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Node Palette */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-4">Add Nodes</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Triggers</h4>
              <div className="space-y-2">
                {TRIGGER_NODES.map((trigger) => (
                  <button
                    key={trigger.type}
                    onClick={() => addNode('trigger', trigger.type, trigger.label)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm text-white ${trigger.color} hover:opacity-90 transition-opacity`}
                  >
                    {trigger.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Actions</h4>
              <div className="space-y-2">
                {ACTION_NODES.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => addNode('action', action.type, action.label)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm text-white ${action.color} hover:opacity-90 transition-opacity`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-gray-50 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              {/* Draw connections between nodes */}
              {nodes.map((node, index) => {
                if (node.type === 'trigger' || node.type === 'condition') {
                  const nextNode = nodes[index + 1]
                  if (nextNode) {
                    return (
                      <line
                        key={`line-${node.id}`}
                        x1={node.position.x + 100}
                        y1={node.position.y + 40}
                        x2={nextNode.position.x}
                        y2={nextNode.position.y + 40}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    )
                  }
                }
                return null
              })}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
            </svg>

            <div className="relative w-full h-full">
              <AnimatePresence>
                {nodes.map((node) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute cursor-move ${
                      node.type === 'trigger' ? 'bg-green-500' :
                      node.type === 'condition' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    } text-white rounded-lg shadow-lg p-4 min-w-[150px] ${
                      selectedNode === node.id ? 'ring-2 ring-blue-400' : ''
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                    }}
                    draggable
                    onDragStart={(e) => {
                      setDraggedNode(node)
                    }}
                    onDragEnd={(e) => {
                      if (draggedNode && e.currentTarget) {
                        const parentElement = e.currentTarget.parentElement as HTMLElement | null
                        if (parentElement) {
                          const rect = parentElement.getBoundingClientRect()
                          const mouseEvent = e as MouseEvent
                          if (mouseEvent.clientX !== undefined && mouseEvent.clientY !== undefined) {
                            updateNodePosition(draggedNode.id, {
                              x: mouseEvent.clientX - rect.left - 75,
                              y: mouseEvent.clientY - rect.top - 40,
                            })
                          }
                        }
                      }
                      setDraggedNode(null)
                    }}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{node.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNode(node.id)
                        }}
                        className="text-white hover:text-red-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs opacity-90">{node.data.nodeType}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-4">Properties</h3>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Node Type</label>
                  <input
                    type="text"
                    value={nodes.find(n => n.id === selectedNode)?.data.nodeType || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={nodes.find(n => n.id === selectedNode)?.label || ''}
                    onChange={(e) => {
                      setNodes(nodes.map(n =>
                        n.id === selectedNode ? { ...n, label: e.target.value } : n
                      ))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Configure node properties here. Full configuration will be available in the rule builder.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a node to edit its properties</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Convert to Rule
          </button>
        </div>
      </div>
    </div>
  )
}

