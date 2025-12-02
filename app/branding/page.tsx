'use client'

import { useState, useEffect } from 'react'
import { PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function BrandingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branding, setBranding] = useState({
    name: '',
    logo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    customDomain: '',
    emailBranding: {
      fromName: '',
      fromEmail: '',
      footerText: '',
      footerLogo: ''
    },
    defaultCurrency: 'USD'
  })
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/branding', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setBranding({
          ...data.organization,
          emailBranding: data.organization.emailBranding || {
            fromName: '',
            fromEmail: '',
            footerText: '',
            footerLogo: ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(branding)
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving branding:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, create a data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setBranding({ ...branding, logo: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          White Labeling & Branding
        </h1>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Branding updated successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              value={branding.name}
              onChange={(e) => setBranding({ ...branding, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="My Organization"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {branding.logo && (
                <img src={branding.logo} alt="Logo" className="h-20 w-20 object-contain border rounded" />
              )}
              <label className="cursor-pointer">
                <div className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <PhotoIcon className="h-5 w-5" />
                  Upload Logo
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-10 w-20 border rounded"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="h-10 w-20 border rounded"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="block text-sm font-medium mb-2">Custom Domain</label>
            <input
              type="text"
              value={branding.customDomain}
              onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="app.yourdomain.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Configure DNS settings to point to this domain
            </p>
          </div>

          {/* Email Branding */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Email Branding</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From Name</label>
                  <input
                    type="text"
                    value={branding.emailBranding.fromName}
                    onChange={(e) => setBranding({
                      ...branding,
                      emailBranding: { ...branding.emailBranding, fromName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Your Organization"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">From Email</label>
                  <input
                    type="email"
                    value={branding.emailBranding.fromEmail}
                    onChange={(e) => setBranding({
                      ...branding,
                      emailBranding: { ...branding.emailBranding, fromEmail: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="noreply@yourdomain.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Footer Text</label>
                <textarea
                  value={branding.emailBranding.footerText}
                  onChange={(e) => setBranding({
                    ...branding,
                    emailBranding: { ...branding.emailBranding, footerText: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Thank you for using our service!"
                />
              </div>
            </div>
          </div>

          {/* Default Currency */}
          <div>
            <label className="block text-sm font-medium mb-2">Default Currency</label>
            <select
              value={branding.defaultCurrency}
              onChange={(e) => setBranding({ ...branding, defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="ILS">ILS - Israeli Shekel</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

