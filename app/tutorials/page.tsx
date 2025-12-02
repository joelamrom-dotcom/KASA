'use client'

import { useState } from 'react'
import { PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface Tutorial {
  id: string
  title: string
  description: string
  videoUrl?: string
  duration: string
  category: string
  completed?: boolean
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([
    {
      id: '1',
      title: 'Getting Started with Kasa',
      description: 'Learn the basics of managing families and payments',
      duration: '5 min',
      category: 'Basics'
    },
    {
      id: '2',
      title: 'Creating and Managing Families',
      description: 'How to add families, members, and update information',
      duration: '8 min',
      category: 'Families'
    },
    {
      id: '3',
      title: 'Payment Processing',
      description: 'Recording payments, creating invoices, and managing installments',
      duration: '10 min',
      category: 'Payments'
    },
    {
      id: '4',
      title: 'Financial Reports',
      description: 'Understanding P&L, balance sheets, and cash flow',
      duration: '12 min',
      category: 'Reports'
    }
  ])
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})

  const markComplete = (tutorialId: string) => {
    setTutorials(prev => prev.map(t => 
      t.id === tutorialId ? { ...t, completed: true } : t
    ))
    setProgress(prev => ({ ...prev, [tutorialId]: 100 }))
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Video Tutorials
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTutorial(tutorial)}
            >
              <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center relative">
                <PlayIcon className="h-16 w-16 text-blue-600" />
                {tutorial.completed && (
                  <div className="absolute top-2 right-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {tutorial.category}
                  </span>
                  <span className="text-xs text-gray-500">{tutorial.duration}</span>
                </div>
                <h3 className="font-semibold mb-1">{tutorial.title}</h3>
                <p className="text-sm text-gray-600">{tutorial.description}</p>
                {progress[tutorial.id] && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${progress[tutorial.id]}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedTutorial && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTutorial.title}</h2>
                    <p className="text-gray-600">{selectedTutorial.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTutorial(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <PlayIcon className="h-20 w-20 text-white" />
                  <p className="text-white ml-4">Video Player Placeholder</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => markComplete(selectedTutorial.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

