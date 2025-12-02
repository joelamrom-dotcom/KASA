'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, ChartBarIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'
import CampaignBuilder from '@/app/components/CampaignBuilder'
import Modal from '@/app/components/Modal'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/communication/campaigns', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Campaigns
          </h1>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Campaign
          </button>
        </div>

        {showBuilder && (
          <div className="mb-6">
            <CampaignBuilder />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No campaigns found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">{campaign.type.toUpperCase()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    campaign.status === 'completed' ? 'bg-green-100 text-green-700' :
                    campaign.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                {campaign.stats && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600">Sent</div>
                      <div className="text-lg font-semibold">{campaign.stats.sent || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Opened</div>
                      <div className="text-lg font-semibold">{campaign.stats.opened || 0}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

