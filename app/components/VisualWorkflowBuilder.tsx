'use client'

import { useState, useCallback } from 'react'
import { PlusIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline'

interface Node {
  id: string
  type: 'trigger' | 'condition' | 'action'
  label: string
  config: any
  position: { x: number, y: number }
}

interface Connection {
  from: string
  to: string
}

export default function VisualWorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const addNode = (type: Node['type']) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      label: type === 'trigger' ? 'Trigger' : type === 'condition' ? 'Condition' : 'Action',
      config: {},
      position: { x: Math.random() * 400, y: Math.random() * 300 }
    }
    setNodes(prev => [...prev, newNode])
  }

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
  }

  const testWorkflow = () => {
    // Test workflow logic
    console.log('Testing workflow:', { nodes, connections })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Visual Workflow Builder</h2>
        <div className="flex gap-2">
          <button
            onClick={testWorkflow}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <PlayIcon className="h-5 w-5" />
            Test Workflow
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-64 border-r pr-4">
          <h3 className="font-semibold mb-4">Add Node</h3>
          <div className="space-y-2">
            <button
              onClick={() => addNode('trigger')}
              className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Trigger
            </button>
            <button
              onClick={() => addNode('condition')}
              className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Condition
            </button>
            <button
              onClick={() => addNode('action')}
              className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Action
            </button>
          </div>
        </div>

        <div className="flex-1 relative border rounded-lg" style={{ minHeight: '500px' }}>
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <p>Drag nodes from the sidebar or click buttons to add</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`absolute p-4 rounded-lg border-2 cursor-move ${
                    selectedNode === node.id ? 'border-blue-500 bg-blue-50' :
                    node.type === 'trigger' ? 'bg-blue-100 border-blue-300' :
                    node.type === 'condition' ? 'bg-yellow-100 border-yellow-300' :
                    'bg-green-100 border-green-300'
                  }`}
                  style={{ left: node.position.x, top: node.position.y }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{node.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNode(node.id)
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedNode && (
        <div className="mt-6 border-t pt-6">
          <h3 className="font-semibold mb-4">Configure Node</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Node configuration panel (configure selected node here)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
