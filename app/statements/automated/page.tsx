'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function AutomatedStatementsPage() {
  const [settings, setSettings] = useState({
    autoGenerateStatements: false,
    statementFrequency: 'monthly',
    statementDay: 1,
    autoSendEmails: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/statements/scheduled', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/statements/scheduled', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        alert('Settings saved successfully!')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateNow = async () => {
    if (!confirm('Generate statements for all families now?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/statements/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          period: settings.statementFrequency,
          sendEmails: settings.autoSendEmails
        })
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Generated ${data.generated} statements successfully!`)
      }
    } catch (error) {
      console.error('Error generating statements:', error)
      alert('Failed to generate statements')
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Automated Statements
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoGenerateStatements}
              onChange={(e) => setSettings({ ...settings, autoGenerateStatements: e.target.checked })}
              className="w-5 h-5"
            />
            <label className="text-lg font-semibold">Enable Automated Statement Generation</label>
          </div>

          {settings.autoGenerateStatements && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select
                  value={settings.statementFrequency}
                  onChange={(e) => setSettings({ ...settings, statementFrequency: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={settings.statementDay}
                  onChange={(e) => setSettings({ ...settings, statementDay: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoSendEmails}
                  onChange={(e) => setSettings({ ...settings, autoSendEmails: e.target.checked })}
                  className="w-5 h-5"
                />
                <label>Automatically email statements to families</label>
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={handleGenerateNow}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Generate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

