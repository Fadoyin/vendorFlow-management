'use client'

import { useState, useRef, useEffect } from 'react'

interface TwoFactorModalProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (code: string, type: 'totp' | 'backup' | 'email') => Promise<void>
  onSendEmailOTP: () => Promise<void>
  tempToken: string
  userEmail: string
  loading: boolean
}

export default function TwoFactorModal({
  isOpen,
  onClose,
  onVerify,
  onSendEmailOTP,
  tempToken,
  userEmail,
  loading
}: TwoFactorModalProps) {
  const [activeTab, setActiveTab] = useState<'totp' | 'backup' | 'email'>('totp')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [emailOTPSent, setEmailOTPSent] = useState(false)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, activeTab])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter a verification code')
      return
    }

    try {
      setError('')
      await onVerify(code, activeTab)
    } catch (error: any) {
      setError(error.message || 'Invalid verification code')
    }
  }

  const handleSendEmailOTP = async () => {
    try {
      setSendingOTP(true)
      setError('')
      await onSendEmailOTP()
      setEmailOTPSent(true)
      setCountdown(60) // 60 second countdown
      setActiveTab('email')
    } catch (error: any) {
      setError(error.message || 'Failed to send email OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // For TOTP and email OTP, only allow 6 digits
    if (activeTab === 'totp' || activeTab === 'email') {
      setCode(value.replace(/\D/g, '').slice(0, 6))
    } else {
      // For backup codes, allow alphanumeric
      setCode(value.toUpperCase().slice(0, 8))
    }
    setError('')
  }

  const handleTabChange = (tab: 'totp' | 'backup' | 'email') => {
    setActiveTab(tab)
    setCode('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Enter your verification code to complete sign in
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('totp')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'totp'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Authenticator
            </button>
            <button
              onClick={() => handleTabChange('backup')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Backup Code
            </button>
            <button
              onClick={() => handleTabChange('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* TOTP Tab */}
          {activeTab === 'totp' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
          )}

          {/* Backup Code Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  Enter one of your backup codes
                </p>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-widest uppercase"
                maxLength={8}
              />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Each backup code can only be used once. Make sure to generate new ones after using them.
                </p>
              </div>
            </div>
          )}

          {/* Email OTP Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  Enter the code sent to your email
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {userEmail}
                </p>
              </div>

              {!emailOTPSent ? (
                <button
                  type="button"
                  onClick={handleSendEmailOTP}
                  disabled={sendingOTP}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    sendingOTP
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {sendingOTP ? 'Sending...' : 'Send Email Code'}
                </button>
              ) : (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSendEmailOTP}
                      disabled={countdown > 0 || sendingOTP}
                      className={`text-sm transition-colors ${
                        countdown > 0 || sendingOTP
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      {countdown > 0 
                        ? `Resend in ${countdown}s` 
                        : sendingOTP 
                        ? 'Sending...' 
                        : 'Resend Code'
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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

          {/* Submit Button */}
          {(activeTab !== 'email' || emailOTPSent) && (
            <button
              type="submit"
              disabled={loading || !code.trim() || (activeTab === 'totp' && code.length !== 6) || (activeTab === 'email' && code.length !== 6)}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                loading || !code.trim() || (activeTab === 'totp' && code.length !== 6) || (activeTab === 'email' && code.length !== 6)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Having trouble? Contact support for assistance with your account.
          </p>
        </div>
      </div>
    </div>
  )
} 