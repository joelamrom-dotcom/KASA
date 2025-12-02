'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, ChartBarIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function CampaignBuilder() {
  const [campaign, setCampaign] = useState({
    name: '',
    type: 'email' as 'email' | 'sms',
    templateId: '',
    recipients: {
      type: 'all' as 'all' | 'filtered' | 'manual',
      filters: {} as any,
      manualList: [] as string[]
    },
    schedule: {
      scheduledAt: '',
      timezone: 'UTC'
    },
    abTest: {
      enabled: false,
      variants: [] as any[]
    }
  })
  const [templates, setTemplates] = useState<any[]>([])
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/message-templates?type=${campaign.type}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const createCampaign = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/communication/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(campaign)
      })
      if (res.ok) {
        alert('Campaign created successfully!')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Campaign Builder</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Name</label>
          <input
            type="text"
            value={campaign.name}
            onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter campaign name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setCampaign({ ...campaign, type: 'email' })}
              className={`px-4 py-2 rounded-lg ${
                campaign.type === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setCampaign({ ...campaign, type: 'sms' })}
              className={`px-4 py-2 rounded-lg ${
                campaign.type === 'sms' ? 'bg-green-600 text-white' : 'bg-gray-100'
              }`}
            >
              SMS
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Template</label>
          <select
            value={campaign.templateId}
            onChange={(e) => setCampaign({ ...campaign, templateId: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select template</option>
            {templates.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Recipients</label>
          <div className="space-y-2">
            <div className="flex gap-4">
              <button
                onClick={() => setCampaign({ ...campaign, recipients: { ...campaign.recipients, type: 'all' } })}
                className={`px-4 py-2 rounded-lg ${
                  campaign.recipients.type === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                All Families
              </button>
              <button
                onClick={() => setCampaign({ ...campaign, recipients: { ...campaign.recipients, type: 'filtered' } })}
                className={`px-4 py-2 rounded-lg ${
                  campaign.recipients.type === 'filtered' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                Filtered
              </button>
              <button
                onClick={() => setCampaign({ ...campaign, recipients: { ...campaign.recipients, type: 'manual' } })}
                className={`px-4 py-2 rounded-lg ${
                  campaign.recipients.type === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                Manual List
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Schedule</label>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={campaign.schedule.scheduledAt}
              onChange={(e) => setCampaign({
                ...campaign,
                schedule: { ...campaign.schedule, scheduledAt: e.target.value }
              })}
              className="px-3 py-2 border rounded-lg"
            />
            <span className="text-sm text-gray-500">or send immediately</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={campaign.abTest.enabled}
              onChange={(e) => setCampaign({
                ...campaign,
                abTest: { ...campaign.abTest, enabled: e.target.checked }
              })}
            />
            <span className="text-sm font-medium">Enable A/B Testing</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={createCampaign}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  )
}

