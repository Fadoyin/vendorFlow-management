'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService } from '@/lib/api'
import { redirectToDashboard } from '@/lib/auth-utils'
import TwoFactorModal from '@/components/auth/TwoFactorModal'

// Enhanced toast with better styling
const toast = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await apiService.login({ email, password })
      
      if (response.data) {
        // Check if 2FA is required
        if (response.data.requiresTwoFactor) {
          setTempToken(response.data.tempToken)
          setShowTwoFactor(true)
          setIsLoading(false)
          return
        }

        // Regular login success - store auth data consistently
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('authToken', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('userData', JSON.stringify(response.data.user)) // For auth-utils compatibility
        localStorage.setItem('tokenExpiry', (Date.now() + (response.data.expires_in * 1000)).toString())
        
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token)
        }
        
        toast.success('Login successful!')
        redirectToDashboard(response.data.user)
      } else if (response.error) {
        setError(response.error)
      } else {
        setError('Login failed - unknown error')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorVerify = async (code: string, type: 'totp' | 'backup' | 'email') => {
    setTwoFactorLoading(true)
    
    try {
      const response = await fetch('/api/auth/2fa/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempToken,
          code,
          type
        })
      })

      const data = await response.json()
      
      if (data.access_token) {
        // Store tokens
        localStorage.setItem('access_token', data.access_token)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        toast.success('2FA verification successful!')
        setShowTwoFactor(false)
        redirectToDashboard(data.user)
      } else {
        throw new Error(data.message || 'Invalid 2FA code')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Verification failed')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleSendEmailOTP = async () => {
    const response = await fetch('/api/auth/2fa/send-email-otp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to send email OTP')
    }
  }

  const closeTwoFactorModal = () => {
    setShowTwoFactor(false)
    setTempToken('')
    setTwoFactorLoading(false)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-revtrack-primary via-revtrack-secondary to-revtrack-primary/90 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg className="w-10 h-10 text-revtrack-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-4xl font-bold text-white drop-shadow-lg">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-lg text-white/90 drop-shadow">
            Sign in to your VendorFlow account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your email address"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-revtrack-primary focus:ring-revtrack-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-revtrack-primary hover:text-revtrack-secondary transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-revtrack-primary ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-revtrack-primary to-revtrack-secondary hover:from-revtrack-secondary hover:to-revtrack-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </span>
                      Sign in to your account
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to VendorFlow?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/auth?mode=signup"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-revtrack-primary"
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create your account
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={showTwoFactor}
        onClose={closeTwoFactorModal}
        onVerify={handleTwoFactorVerify}
        onSendEmailOTP={handleSendEmailOTP}
        tempToken={tempToken}
        userEmail={email}
        loading={twoFactorLoading}
      />
    </>
  )
}
