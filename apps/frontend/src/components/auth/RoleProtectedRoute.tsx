'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getStoredUser, isAuthenticated, redirectToDashboard } from '@/lib/auth-utils'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo 
}: RoleProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push('/auth?mode=login')
        return
      }

      const user = getStoredUser()
      if (!user) {
        router.push('/auth?mode=login')
        return
      }

      // If no specific roles are required, allow access
      if (allowedRoles.length === 0) {
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }

      const userRole = user.role?.toLowerCase()
      const hasRequiredRole = allowedRoles.some(role => 
        role.toLowerCase() === userRole
      )

      if (!hasRequiredRole) {
        // User doesn't have required role, redirect them
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          // Redirect to their appropriate dashboard
          redirectToDashboard(user)
        }
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAccess()
  }, [router, pathname, allowedRoles, redirectTo])

  // Show loading state while checking authorization
  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null
}

// Helper component for specific role protection
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      {children}
    </RoleProtectedRoute>
  )
}

export function VendorRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['vendor']}>
      {children}
    </RoleProtectedRoute>
  )
}

export function SupplierRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['supplier']}>
      {children}
    </RoleProtectedRoute>
  )
}

// Multi-role protection components
export function AdminOrVendorRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'vendor']}>
      {children}
    </RoleProtectedRoute>
  )
}

export function AdminOrSupplierRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'supplier']}>
      {children}
    </RoleProtectedRoute>
  )
} 