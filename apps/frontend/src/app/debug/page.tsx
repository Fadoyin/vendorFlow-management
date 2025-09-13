'use client'

import { useState, useEffect } from 'react'
import { getUserFromStorage, isAuthenticated } from '@/lib/auth-utils'
import { apiService, ordersApi, vendorsApi, suppliersApi } from '@/lib/api'

export default function DebugPage() {
  const [authState, setAuthState] = useState<any>({})
  const [apiTests, setApiTests] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function runTests() {
      // Check auth state
      const user = getUserFromStorage()
      const isAuth = isAuthenticated()
      const apiAuth = apiService.isAuthenticated()
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

      setAuthState({
        user,
        isAuth,
        apiAuth,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      })

      // Test API calls
      const tests: any = {}
      
      try {
        const ordersResult = await ordersApi.getAll({ page: 1, limit: 5 })
        tests.orders = { success: true, data: ordersResult }
      } catch (error: any) {
        tests.orders = { success: false, error: error.message }
      }

      try {
        const vendorsResult = await vendorsApi.getAll({ page: 1, limit: 5 })
        tests.vendors = { success: true, data: vendorsResult }
      } catch (error: any) {
        tests.vendors = { success: false, error: error.message }
      }

      try {
        const suppliersResult = await suppliersApi.getAll({ page: 1, limit: 5 })
        tests.suppliers = { success: true, data: suppliersResult }
      } catch (error: any) {
        tests.suppliers = { success: false, error: error.message }
      }

      setApiTests(tests)
      setLoading(false)
    }

    runTests()
  }, [])

  const goToLogin = () => {
    window.location.href = '/login'
  }

  const goToDashboard = () => {
    window.location.href = '/dashboard'
  }

  const clearStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  if (loading) {
    return <div className="p-8">Loading debug info...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Dashboard</h1>
      
      <div className="space-y-6">
        {/* Authentication State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Authentication State</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        {/* API Tests */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">API Tests</h2>
          {Object.entries(apiTests).map(([key, result]: [string, any]) => (
            <div key={key} className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">{key.toUpperCase()}</h3>
              <div className={`p-3 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                {result.success ? (
                  <div>
                    <div className="text-green-600 font-medium">✓ Success</div>
                    <pre className="text-sm mt-2 max-h-32 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="font-medium">✗ Failed</div>
                    <div className="text-sm mt-1">{result.error}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={goToLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
            <button 
              onClick={goToDashboard}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={clearStorage}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 