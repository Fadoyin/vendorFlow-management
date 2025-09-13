'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { redirectToDashboard } from '@/lib/auth-utils'
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('signup')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    role: 'vendor',
    inviteCode: ''
  })

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'signup' || mode === 'register') {
      setIsLogin(false)
    } else {
      setIsLogin(true)
    }
  }, [searchParams])

  // Helper function to handle successful authentication
  const handleAuthSuccess = (authData: any, isSignup: boolean = false) => {
    try {
      // Store authentication data consistently
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('authToken', authData.access_token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      localStorage.setItem('userData', JSON.stringify(authData.user)) // For auth-utils compatibility
      localStorage.setItem('tokenExpiry', (Date.now() + (authData.expires_in * 1000)).toString())
      
      if (authData.refresh_token) {
        localStorage.setItem('refresh_token', authData.refresh_token)
      }
      
      setShowOtpModal(false)
      const actionText = isSignup ? 'Registration' : 'Login'
      setSuccess(`${actionText} successful! Redirecting to your dashboard...`)
      
      console.log(`${actionText} successful for user:`, authData.user.email, 'Role:', authData.user.role)
      
      // Use role-based redirect after a short delay
      setTimeout(() => {
        redirectToDashboard(authData.user)
      }, 1500)
    } catch (error) {
      console.error('Error storing auth data:', error)
      setError('Authentication successful but failed to save session. Please try logging in again.')
    }
  }

  const handleOtpSuccess = async (response: any) => {
    console.log('🎯 handleOtpSuccess called with:', response)
    
    // Handle both direct response and wrapped response
    const authData = response.data || response
    
    if (authData && authData.access_token) {
      console.log('✅ Valid auth data found, calling handleAuthSuccess')
      handleAuthSuccess(authData, otpPurpose === 'signup')
    } else {
      console.error('❌ No valid auth data found:', authData)
      setError('Authentication failed. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (isLogin) {
        // Handle login
        const response = await authApi.login({
          email: formData.email,
          password: formData.password
        })
        
        if (response.data && !response.error && response.data?.twoFactorRequired && response.data?.requiresOtp) {
          setOtpEmail(formData.email)
          setOtpPurpose('login')
          setShowOtpModal(true)
          setSuccess('2FA is enabled. Please enter the OTP sent to your email.')
        } else if (response.data && !response.error && response.data?.access_token) {
          // Direct login success (2FA not enabled)
          handleAuthSuccess(response.data, false)
        } else {
          setError(response.error || 'Login failed - please check your credentials')
        }
      } else {
        // Handle signup
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match!')
          return
        }

        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long')
          return
        }

        const registrationData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          role: formData.role as any,
          ...(formData.inviteCode && { inviteCode: formData.inviteCode })
        }

        const response = await authApi.register(registrationData)

        if (response.data && !response.error && response.data.requiresOtp) {
          // OTP verification required
          setOtpEmail(formData.email)
          setOtpPurpose('signup')
          setShowOtpModal(true)
          setSuccess('Registration initiated! Please check your email for the verification code.')
        } else if (response.data && !response.error && response.data.access_token) {
          // Direct registration success (no OTP required - fallback case)
          handleAuthSuccess(response.data, true)
        } else {
          setError(response.error || 'Registration failed. Please try again.')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Email already registered') || error.message?.includes('409')) {
        setError('This email is already registered. Please use a different email or try logging in.')
      } else if (error.message?.includes('Rate limited') || error.message?.includes('429')) {
        setError('Too many attempts. Please wait a moment before trying again.')
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed. Please try again.`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
            {isLogin ? 'Welcome back' : 'Join VendorFlow'}
          </h2>
          <p className="mt-2 text-center text-lg text-white/90 drop-shadow">
            {isLogin 
              ? 'Sign in to your VendorFlow account' 
              : 'Create your account to get started'
            }
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

              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 font-medium">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field */}
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
                    value={formData.email}
                    onChange={handleInputChange}
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

              {/* Signup-only fields */}
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your first name"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      autoComplete="organization"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="inviteCode" className="block text-sm font-semibold text-gray-700 mb-2">
                      Invite Code <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      id="inviteCode"
                      name="inviteCode"
                      type="text"
                      value={formData.inviteCode}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter invite code (email or company name)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Join an existing company by entering an admin's email or company name
                    </p>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                </>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
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

              {/* Confirm Password for Signup */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-revtrack-primary focus:z-10 sm:text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
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
              )}

              {/* Remember me for login */}
              {isLogin && (
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
              )}

              {/* Submit Button */}
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
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </div>
                  ) : (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        {isLogin ? (
                          <svg className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        )}
                      </span>
                      {isLogin ? 'Sign in to your account' : 'Create your account'}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Switch between login/signup */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {isLogin ? 'New to VendorFlow?' : 'Already have an account?'}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {isLogin ? (
                  <button
                    onClick={() => setIsLogin(false)}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-revtrack-primary"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create your account
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsLogin(true)}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-revtrack-primary"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign in to your account
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={otpEmail}
        purpose={otpPurpose}
        onVerify={async (otp: string) => {
          try {
            setIsLoading(true)
            setError("")
            console.log("🔐 Verifying OTP:", { email: otpEmail, purpose: otpPurpose })
            const response = await authApi.verifyOtp(otpEmail, otp, otpPurpose)
            console.log("📧 OTP Verification Response:", response)
            
            if (response.data && !response.error) {
              console.log("✅ OTP verification successful, handling auth success...")
              await handleOtpSuccess(response)
            } else {
              console.error("❌ OTP verification failed:", response)
              setError(response.error || response.message || "OTP verification failed")
            }
          } catch (err: any) {
            console.error("💥 OTP verification error:", err)
            setError(err.message || "Failed to verify OTP. Please try again.")
          } finally {
            setIsLoading(false)
          }
        }}
        onResend={async () => {
          try {
            setError("")
            const response = await authApi.sendOtp(otpEmail, otpPurpose)
            if (response.data && !response.error) {
              setSuccess("New OTP sent! Check your email.")
              setTimeout(() => setSuccess(""), 3000)
            } else {
              setError(response.message || "Failed to resend OTP")
            }
          } catch (err: any) {
            setError(err.message || "Failed to resend OTP. Please try again.")
          }
        }}
      />
    </>
  )
}
