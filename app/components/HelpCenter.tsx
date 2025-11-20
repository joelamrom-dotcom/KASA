'use client'

import { useState } from 'react'
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Modal from './Modal'

interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

interface HelpCenterProps {
  articles?: HelpArticle[]
}

const defaultArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Kasa',
    content: 'Learn how to set up your account, add families, and start managing payments.',
    category: 'Getting Started',
    tags: ['setup', 'basics'],
  },
  {
    id: '2',
    title: 'Adding and Managing Families',
    content: 'Step-by-step guide on how to add families, update information, and manage family members.',
    category: 'Families',
    tags: ['families', 'members'],
  },
  {
    id: '3',
    title: 'Payment Processing',
    content: 'How to record payments, process refunds, and manage payment plans.',
    category: 'Payments',
    tags: ['payments', 'refunds'],
  },
  {
    id: '4',
    title: 'Generating Reports',
    content: 'Create custom reports, export data, and schedule automated reports.',
    category: 'Reports',
    tags: ['reports', 'export'],
  },
]

export default function HelpCenter({ articles = defaultArticles }: HelpCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  const categories = Array.from(new Set(articles.map((a) => a.category)))

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = !selectedCategory || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
        aria-label="Open help center"
      >
        <QuestionMarkCircleIcon className="h-6 w-6" />
        <span className="hidden sm:inline">Help</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          setSearchQuery('')
          setSelectedCategory(null)
          setSelectedArticle(null)
        }}
        size="xl"
        title="Help Center"
      >
        {selectedArticle ? (
          <div>
            <button
              onClick={() => setSelectedArticle(null)}
              className="mb-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              ← Back to articles
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {selectedArticle.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedArticle.content}</p>
            <div className="flex gap-2 flex-wrap">
              {selectedArticle.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No articles found. Try a different search term.
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {article.content}
                        </p>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {article.category}
                        </span>
                      </div>
                      <BookOpenIcon className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

