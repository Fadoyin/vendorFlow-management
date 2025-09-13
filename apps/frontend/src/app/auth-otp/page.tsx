'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal'

export default function AuthOtpPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('signup')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    role: 'vendor',
    inviteCode: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (isLogin) {
        // Step 1: Initiate login (sends OTP)
        const response = await authApi.login({
          email: formData.email,
          password: formData.password
        })
        
        if (response.data?.access_token) {
          setOtpEmail(formData.email)
          setOtpPurpose('login')
          setShowOtpModal(true)
          setSuccess('OTP sent to your email. Please check your inbox.')
        } else {
          setError(response.message || 'Login failed')
        }
      } else {
        // Step 1: Initiate registration (sends OTP)
        const registrationData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          role: formData.role as any
        }

        const response = await authApi.register(registrationData)

        if (response.data?.access_token) {
          setOtpEmail(formData.email)
          setOtpPurpose('signup')
          setShowOtpModal(true)
          setSuccess('OTP sent to your email. Please check your inbox.')
        } else {
          setError(response.message || 'Registration failed')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSuccess = async (verificationResult: any) => {
    setShowOtpModal(false)
    
    if (verificationResult.data?.access_token) {
      // Store authentication data
      localStorage.setItem('access_token', verificationResult.data.access_token)
      localStorage.setItem('authToken', verificationResult.data.access_token)
      localStorage.setItem('user', JSON.stringify(verificationResult.data.user))
      localStorage.setItem('tokenExpiry', (Date.now() + (verificationResult.data.expires_in * 1000)).toString())
      
      const action = otpPurpose === 'signup' ? 'Registration' : 'Login'
      setSuccess(`${action} successful! Redirecting...`)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      setError('Verification successful but authentication failed. Please try again.')
    }
  }

  const handleOtpCancel = () => {
    setShowOtpModal(false)
    setOtpEmail('')
    setError('')
    setSuccess('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enhanced with OTP verification
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-600">{success}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your company name"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <OtpVerificationModal
            isOpen={showOtpModal}
            onClose={handleOtpCancel}
            email={otpEmail}
            purpose={otpPurpose}
            onVerify={async (otp: string) => {
              try {
                setIsLoading(true)
                setError('')
                const response = await authApi.verifyOtp(otpEmail, otp, otpPurpose)
                
                if (response.data?.access_token) {
                  await handleOtpSuccess(response)
                } else {
                  setError(response.message || 'OTP verification failed')
                }
              } catch (err: any) {
                setError(err.message || 'Failed to verify OTP. Please try again.')
              } finally {
                setIsLoading(false)
              }
            }}
            onResend={async () => {
              try {
                setError('')
                const response = await authApi.sendOtp(otpEmail, otpPurpose)
                if (response.data && !response.message) {
                  setSuccess('New OTP sent! Check your email.')
                  setTimeout(() => setSuccess(''), 3000)
                } else {
                  setError(response.message || 'Failed to resend OTP')
                }
              } catch (err: any) {
                setError(err.message || 'Failed to resend OTP. Please try again.')
              }
            }}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </div>
  )
} 