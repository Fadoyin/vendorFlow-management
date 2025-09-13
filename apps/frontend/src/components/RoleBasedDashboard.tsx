'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserFromStorage, isAuthenticated, getDashboardUrlForRole } from '@/lib/auth-utils'

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
  status: string;
}

export function RoleBasedDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check authentication and redirect if needed
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/auth?mode=login')
        return
      }

      const currentUser = getUserFromStorage()
      if (!currentUser) {
        router.push('/auth?mode=login')
        return
      }

      setUser(currentUser)

      // If user is not admin, redirect to their specific dashboard
      const userRole = currentUser.role?.toLowerCase() || ''
      if (userRole === 'vendor') {
        router.push('/dashboard/vendor')
        return
      } else if (userRole === 'supplier') {
        router.push('/dashboard/supplier')
        return
      }

      // For admin users, stay on the main dashboard
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-revtrack-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // This component doesn't render anything visible if loading is complete
  // because the user should be redirected to their appropriate dashboard
  return null
} 