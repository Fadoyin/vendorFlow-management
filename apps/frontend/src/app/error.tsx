'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h1>
        <p className="text-gray-600 mb-6">
          An error occurred while loading this page. Please try refreshing or contact support if the problem persists.
        </p>
        <div className="space-x-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

