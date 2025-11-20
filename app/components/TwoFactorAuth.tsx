'use client'

import { useState } from 'react'
import {
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import Modal from './Modal'

interface TwoFactorAuthProps {
  userId: string
  twoFactorEnabled: boolean
  onUpdate: () => void
}

export default function TwoFactorAuth({
  userId,
  twoFactorEnabled,
  onUpdate,
}: TwoFactorAuthProps) {
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationToken, setVerificationToken] = useState('')
  const [password, setPassword] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        const data = await res.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setBackupCodes(data.backupCodes)
        setSetupStep('qr')
        setShowSetupModal(true)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to setup 2FA')
      }
    } catch (err) {
      setError('Error setting up 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationToken) {
      setError('Please enter the verification code')
      return
    }

    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      if (res.ok) {
        setShowSetupModal(false)
        setVerificationToken('')
        onUpdate()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('Error verifying code')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!password && !backupCode) {
      setError('Please enter your password or a backup code')
      return
    }

    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password, backupCode }),
      })

      if (res.ok) {
        setShowDisableModal(false)
        setPassword('')
        setBackupCode('')
        onUpdate()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to disable 2FA')
      }
    } catch (err) {
      setError('Error disabling 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {twoFactorEnabled ? (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-400">Disabled</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          {twoFactorEnabled ? (
            <button
              onClick={() => setShowDisableModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleSetup}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false)
          setSetupStep('qr')
          setVerificationToken('')
          setError('')
        }}
        title="Setup Two-Factor Authentication"
      >
        <div className="space-y-6">
          {setupStep === 'qr' && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCode && (
                  <div className="flex justify-center mb-4">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 border border-gray-300 dark:border-gray-700 rounded-lg" />
                  </div>
                )}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Or enter this code manually:</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{secret}</code>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Save these backup codes:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, idx) => (
                      <code key={idx} className="text-xs font-mono text-yellow-900 dark:text-yellow-100 bg-white dark:bg-gray-800 p-2 rounded">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSetupStep('verify')}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  I've scanned the QR code
                </button>
              </div>
            </>
          )}

          {setupStep === 'verify' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter verification code
                </label>
                <input
                  type="text"
                  value={verificationToken}
                  onChange={e => {
                    setVerificationToken(e.target.value)
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center text-2xl tracking-widest"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSetupStep('qr')}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading || !verificationToken}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false)
          setPassword('')
          setBackupCode('')
          setError('')
        }}
        title="Disable Two-Factor Authentication"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            To disable 2FA, please enter your password or use a backup code.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter your password"
            />
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">OR</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backup Code
            </label>
            <input
              type="text"
              value={backupCode}
              onChange={e => {
                setBackupCode(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter a backup code"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDisableModal(false)
                setPassword('')
                setBackupCode('')
                setError('')
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable}
              disabled={loading || (!password && !backupCode)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

