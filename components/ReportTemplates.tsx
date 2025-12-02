'use client'

import { useState, useEffect } from 'react'
import { DocumentTextIcon, SparklesIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

interface ReportTemplate {
  _id?: string
  name: string
  description?: string
  category: 'financial' | 'sales' | 'operations' | 'custom'
  icon?: string
  reportDefinition: any
  isPublic: boolean
  usageCount: number
  tags?: string[]
}

interface ReportTemplatesProps {
  onSelectTemplate: (template: ReportTemplate) => void
  onClose: () => void
}

export default function ReportTemplates({ onSelectTemplate, onClose }: ReportTemplatesProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/reports/templates', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'financial', label: 'Financial' },
    { value: 'sales', label: 'Sales' },
    { value: 'operations', label: 'Operations' },
    { value: 'custom', label: 'Custom' },
  ]

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  const defaultTemplates: ReportTemplate[] = [
    {
      name: 'Payment Summary',
      description: 'Summary of all payments with totals and averages',
      category: 'financial',
      reportDefinition: {
        fields: [
          { fieldName: 'payment.amount', label: 'Amount', dataType: 'currency', aggregate: 'sum' },
          { fieldName: 'payment.paymentDate', label: 'Date', dataType: 'date' },
          { fieldName: 'family.name', label: 'Family', dataType: 'string' },
        ],
        dateRange: { type: 'this_year' },
      },
      isPublic: true,
      usageCount: 0,
    },
    {
      name: 'Family Overview',
      description: 'Complete overview of families and their details',
      category: 'operations',
      reportDefinition: {
        fields: [
          { fieldName: 'family.name', label: 'Family Name', dataType: 'string' },
          { fieldName: 'family.email', label: 'Email', dataType: 'string' },
          { fieldName: 'family.phone', label: 'Phone', dataType: 'string' },
        ],
      },
      isPublic: true,
      usageCount: 0,
    },
    {
      name: 'Monthly Revenue',
      description: 'Monthly revenue breakdown with trends',
      category: 'financial',
      reportDefinition: {
        fields: [
          { fieldName: 'payment.amount', label: 'Amount', dataType: 'currency', aggregate: 'sum' },
          { fieldName: 'payment.paymentDate', label: 'Month', dataType: 'date', groupBy: true },
        ],
        dateRange: { type: 'this_year' },
        groupBy: ['payment.paymentDate'],
      },
      isPublic: true,
      usageCount: 0,
    },
  ]

  const allTemplates = [...defaultTemplates, ...filteredTemplates]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Report Templates</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  selectedCategory === cat.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : allTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No templates available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTemplates.map((template, index) => (
                <div
                  key={index}
                  onClick={() => onSelectTemplate(template)}
                  className="border rounded-lg p-4 hover:border-purple-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <DocumentTextIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {template.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {template.usageCount > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      Used {template.usageCount} times
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

