'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified auth page with login mode
    router.replace('/auth?mode=login')
  }, [router])

  return (
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
          Redirecting...
        </h2>
        <p className="mt-2 text-center text-lg text-white/90 drop-shadow">
          Taking you to the login page
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-revtrack-primary"></div>
          </div>
          <p className="mt-4 text-center text-gray-600">
            Redirecting to login page...
          </p>
        </div>
      </div>
    </div>
  )
}
