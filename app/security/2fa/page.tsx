'use client'

import { useState, useEffect } from 'react'
import { ShieldCheckIcon, DevicePhoneMobileIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

type TwoFAMethod = 'totp' | 'sms' | 'email' | null

export default function TwoFactorAuthPage() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFAMethod, setTwoFAMethod] = useState<TwoFAMethod>(null)
  const [setupStep, setSetupStep] = useState<'select' | 'setup' | 'verify'>('select')
  const [qrCode, setQRCode] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    fetch2FAStatus()
  }, [])

  const fetch2FAStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setTwoFAEnabled(data.enabled || false)
        setTwoFAMethod(data.method || null)
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    }
  }

  const setup2FA = async (method: TwoFAMethod) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ method })
      })

      if (res.ok) {
        const data = await res.json()
        if (method === 'totp') {
          setQRCode(data.qrCode)
          setBackupCodes(data.backupCodes)
          setSetupStep('verify')
        } else {
          // SMS/Email - send code
          setSetupStep('verify')
        }
        setTwoFAMethod(method)
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code: verificationCode,
          method: twoFAMethod,
          action: 'enable'
        })
      })

      if (res.ok) {
        setTwoFAEnabled(true)
        setSetupStep('select')
        setVerificationCode('')
        if (twoFAMethod === 'totp') {
          setShowBackupCodes(true)
        }
      } else {
        alert('Invalid verification code')
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'disable' })
      })

      if (res.ok) {
        setTwoFAEnabled(false)
        setTwoFAMethod(null)
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Two-Factor Authentication
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          {twoFAEnabled ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <h2 className="text-xl font-semibold">2FA Enabled</h2>
                    <p className="text-sm text-gray-500">
                      Method: {twoFAMethod === 'totp' ? 'Authenticator App' : twoFAMethod === 'sms' ? 'SMS' : 'Email'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={disable2FA}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Enable Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-6">
                Add an extra layer of security to your account by requiring a second verification method.
              </p>

              {setupStep === 'select' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setup2FA('totp')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                  >
                    <KeyIcon className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold mb-2">Authenticator App</h3>
                    <p className="text-sm text-gray-600">
                      Use Google Authenticator, Authy, or similar apps
                    </p>
                  </button>

                  <button
                    onClick={() => setup2FA('sms')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                  >
                    <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold mb-2">SMS</h3>
                    <p className="text-sm text-gray-600">
                      Receive verification codes via text message
                    </p>
                  </button>

                  <button
                    onClick={() => setup2FA('email')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                  >
                    <EnvelopeIcon className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold mb-2">Email</h3>
                    <p className="text-sm text-gray-600">
                      Receive verification codes via email
                    </p>
                  </button>
                </div>
              )}

              {setupStep === 'verify' && (
                <div className="space-y-4">
                  {twoFAMethod === 'totp' && qrCode && (
                    <div className="text-center">
                      <p className="mb-4">Scan this QR code with your authenticator app:</p>
                      <img src={qrCode} alt="QR Code" className="mx-auto border rounded-lg" />
                      <p className="text-sm text-gray-500 mt-4">
                        Can't scan? Enter this code manually: <code className="bg-gray-100 px-2 py-1 rounded">{backupCodes[0]?.substring(0, 8)}</code>
                      </p>
                    </div>
                  )}

                  {(twoFAMethod === 'sms' || twoFAMethod === 'email') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">
                        A verification code has been sent to your {twoFAMethod === 'sms' ? 'phone' : 'email'}.
                        Enter it below to enable 2FA.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-3 py-2 border rounded-lg"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={verifyAndEnable}
                      disabled={loading || verificationCode.length !== 6}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    <button
                      onClick={() => {
                        setSetupStep('select')
                        setVerificationCode('')
                        setQRCode('')
                      }}
                      className="px-6 py-2 border rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showBackupCodes && (
          <Modal isOpen={showBackupCodes} onClose={() => setShowBackupCodes(false)}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Save Your Backup Codes</h2>
              <p className="text-gray-600 mb-4">
                These codes can be used to access your account if you lose access to your authenticator app.
                Save them in a safe place.
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="p-2 bg-white rounded">{code}</div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                I've Saved These Codes
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}

