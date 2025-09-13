'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import Image from 'next/image'

interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

interface TwoFactorStatus {
  enabled: boolean
  backupCodesCount: number
}

export default function SecuritySettingsPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null)
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadTwoFactorStatus()
  }, [])

  const loadTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTwoFactorStatus(data.data)
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startSetup = async () => {
    try {
      setError('')
      const response = await fetch('/api/auth/2fa/setup', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSetupData(data.data)
      } else {
        setError('Failed to generate setup data')
      }
    } catch (error) {
      setError('Network error occurred')
    }
  }

  const enable2FA = async () => {
    if (!setupData || !verificationCode) {
      setError('Please enter the verification code from your authenticator app')
      return
    }

    try {
      setEnabling(true)
      setError('')
      
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationCode,
          backupCodes: setupData.backupCodes
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('2FA enabled successfully!')
        setShowBackupCodes(true)
        setSetupData(null)
        setVerificationCode('')
        loadTwoFactorStatus()
      } else {
        setError(data.message || 'Failed to enable 2FA')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setEnabling(false)
    }
  }

  const disable2FA = async () => {
    if (!password) {
      setError('Please enter your password to disable 2FA')
      return
    }

    try {
      setDisabling(true)
      setError('')
      
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('2FA disabled successfully')
        setPassword('')
        loadTwoFactorStatus()
      } else {
        setError(data.message || 'Failed to disable 2FA')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setDisabling(false)
    }
  }

  const regenerateBackupCodes = async () => {
    if (!password) {
      setError('Please enter your password to regenerate backup codes')
      return
    }

    try {
      setError('')
      
      const response = await fetch('/api/auth/2fa/regenerate-backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()
      if (data.success) {
        setNewBackupCodes(data.data.backupCodes)
        setShowBackupCodes(true)
        setSuccess('Backup codes regenerated successfully')
        setPassword('')
        loadTwoFactorStatus()
      } else {
        setError(data.message || 'Failed to regenerate backup codes')
      }
    } catch (error) {
      setError('Network error occurred')
    }
  }

  const copyBackupCodes = () => {
    const codes = newBackupCodes.length > 0 ? newBackupCodes : setupData?.backupCodes || []
    navigator.clipboard.writeText(codes.join('\n'))
    setSuccess('Backup codes copied to clipboard')
  }

  const downloadBackupCodes = () => {
    const codes = newBackupCodes.length > 0 ? newBackupCodes : setupData?.backupCodes || []
    const blob = new Blob([`VendorFlow 2FA Backup Codes\n\n${codes.join('\n')}\n\nKeep these codes safe and secure!`], 
      { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendorflow-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <DashboardLayout title="Security Settings" description="Loading security settings...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Security Settings" description="Manage your account security and two-factor authentication">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication Section */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-gray-600 mt-1">
                Add an extra layer of security to your account with 2FA
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              twoFactorStatus?.enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {twoFactorStatus?.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {!twoFactorStatus?.enabled ? (
            // 2FA Setup Flow
            <div className="space-y-6">
              {!setupData ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Your Account</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                  </p>
                  <button
                    onClick={startSetup}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Set Up 2FA
                  </button>
                </div>
              ) : (
                // Setup Process
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* QR Code Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">1. Scan QR Code</h3>
                      <p className="text-gray-600">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </p>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                        <Image
                          src={setupData.qrCodeUrl}
                          alt="2FA QR Code"
                          width={200}
                          height={200}
                          className="mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Can't scan? Enter this code manually: <br />
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">
                          {setupData.secret}
                        </code>
                      </p>
                    </div>

                    {/* Verification Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">2. Enter Verification Code</h3>
                      <p className="text-gray-600">
                        Enter the 6-digit code from your authenticator app to verify the setup
                      </p>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                          maxLength={6}
                        />
                        <button
                          onClick={enable2FA}
                          disabled={enabling || verificationCode.length !== 6}
                          className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                            enabling || verificationCode.length !== 6
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {enabling ? 'Enabling...' : 'Enable 2FA'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 2FA Management (Already Enabled)
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      Two-factor authentication is enabled and protecting your account.
                      You have {twoFactorStatus.backupCodesCount} backup codes remaining.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Regenerate Backup Codes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Backup Codes</h3>
                  <p className="text-gray-600">
                    Generate new backup codes to access your account if you lose your authenticator device.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={regenerateBackupCodes}
                      disabled={!password}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        !password
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Regenerate Backup Codes
                    </button>
                  </div>
                </div>

                {/* Disable 2FA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Disable 2FA</h3>
                  <p className="text-gray-600">
                    Remove two-factor authentication from your account. This will make your account less secure.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={disable2FA}
                      disabled={disabling || !password}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        disabling || !password
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {disabling ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Backup Codes Modal */}
        {showBackupCodes && (setupData?.backupCodes || newBackupCodes.length > 0) && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Save Your Backup Codes</h3>
                <p className="text-gray-600 mt-2">
                  These codes can be used to access your account if you lose your authenticator device. 
                  Save them in a secure location.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {(newBackupCodes.length > 0 ? newBackupCodes : setupData?.backupCodes || []).map((code, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded border text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Copy Codes
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Download
                </button>
              </div>

              <button
                onClick={() => {
                  setShowBackupCodes(false)
                  setNewBackupCodes([])
                  setSuccess('')
                }}
                className="w-full mt-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                I've saved my backup codes
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 