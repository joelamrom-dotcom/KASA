'use client'

import { useState, useEffect } from 'react'
import { CogIcon, ChartBarIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface DashboardComponent {
  id: string
  type: string
  title: string
  position: { x: number; y: number; width: number; height: number }
}

export default function DashboardCustomizer() {
  const [components, setComponents] = useState<DashboardComponent[]>([])
  const [layout, setLayout] = useState({ type: 'grid', columns: 2, rows: 2 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/dashboard/customize', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setLayout(data.dashboard.layout || layout)
        setComponents(data.dashboard.components || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/dashboard/customize', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ layout, components })
      })
      if (res.ok) {
        alert('Dashboard saved successfully!')
      }
    } catch (error) {
      console.error('Error saving dashboard:', error)
      alert('Failed to save dashboard')
    } finally {
      setSaving(false)
    }
  }

  const availableWidgets = [
    { id: 'total-families', type: 'stat', title: 'Total Families', icon: UserGroupIcon },
    { id: 'total-revenue', type: 'stat', title: 'Total Revenue', icon: CurrencyDollarIcon },
    { id: 'payment-chart', type: 'chart', title: 'Payment Chart', icon: ChartBarIcon }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customize Dashboard</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Available Widgets</h3>
          <div className="space-y-2">
            {availableWidgets.map((widget) => (
              <div
                key={widget.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-move"
                draggable
              >
                <div className="flex items-center gap-2">
                  <widget.icon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">{widget.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Dashboard Layout</h3>
          <div className="grid grid-cols-2 gap-4 min-h-[400px]">
            {components.map((comp) => (
              <div
                key={comp.id}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4"
              >
                <p className="text-sm font-medium">{comp.title}</p>
              </div>
            ))}
            {components.length === 0 && (
              <div className="col-span-2 flex items-center justify-center text-gray-400">
                Drag widgets here to add them
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

