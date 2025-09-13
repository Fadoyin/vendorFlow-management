'use client'

import { useState, useEffect } from 'react'

export default function TestAuthPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    // Check current authentication state
    const checkAuth = () => {
      addLog('🔍 Checking authentication state...')
      
      const access_token = localStorage.getItem('access_token')
      const authToken = localStorage.getItem('authToken')
      const user = localStorage.getItem('user')
      const userData = localStorage.getItem('userData')
      
      addLog(`access_token: ${access_token ? 'EXISTS' : 'MISSING'}`)
      addLog(`authToken: ${authToken ? 'EXISTS' : 'MISSING'}`)
      addLog(`user: ${user ? 'EXISTS' : 'MISSING'}`)
      addLog(`userData: ${userData ? 'EXISTS' : 'MISSING'}`)
      
      if (user) {
        try {
          const parsedUser = JSON.parse(user)
          addLog(`User role: ${parsedUser.role}`)
          addLog(`User email: ${parsedUser.email}`)
          setAuthData(parsedUser)
        } catch (error) {
          addLog(`❌ Error parsing user data: ${error}`)
        }
      }
    }
    
    checkAuth()
  }, [])

  const testRedirect = (role: string) => {
    addLog(`🚀 Testing redirect for role: ${role}`)
    
    const targetUrl = role === 'vendor' ? '/dashboard/vendor' : '/dashboard'
    addLog(`🎯 Target URL: ${targetUrl}`)
    
    // Test the redirect
    setTimeout(() => {
      addLog(`⏰ Executing redirect to: ${targetUrl}`)
      window.location.href = targetUrl
    }, 1000)
  }

  const clearAuth = () => {
    localStorage.clear()
    addLog('🧹 Cleared all localStorage')
    setAuthData(null)
  }

  const simulateOtpSuccess = () => {
    addLog('🔐 Simulating OTP success...')
    
    const mockAuthData = {
      access_token: 'mock_token_123',
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'vendor',
        companyName: 'Test Company'
      },
      expires_in: 3600
    }
    
    // Store auth data
    localStorage.setItem('access_token', mockAuthData.access_token)
    localStorage.setItem('authToken', mockAuthData.access_token)
    localStorage.setItem('user', JSON.stringify(mockAuthData.user))
    localStorage.setItem('userData', JSON.stringify(mockAuthData.user))
    localStorage.setItem('tokenExpiry', (Date.now() + (mockAuthData.expires_in * 1000)).toString())
    
    addLog('💾 Mock auth data stored')
    setAuthData(mockAuthData.user)
    
    // Test redirect
    testRedirect(mockAuthData.user.role)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
          {authData ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {authData.email}</p>
              <p><strong>Role:</strong> {authData.role}</p>
              <p><strong>Name:</strong> {authData.firstName} {authData.lastName}</p>
              <p><strong>Company:</strong> {authData.companyName}</p>
            </div>
          ) : (
            <p className="text-gray-500">No authentication data found</p>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={simulateOtpSuccess}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Simulate OTP Success
            </button>
            <button
              onClick={() => testRedirect('vendor')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Vendor Redirect
            </button>
            <button
              onClick={() => testRedirect('admin')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Admin Redirect
            </button>
            <button
              onClick={clearAuth}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Auth Data
            </button>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-black rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Debug Logs</h2>
          <div className="space-y-1 font-mono text-sm text-green-400 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 