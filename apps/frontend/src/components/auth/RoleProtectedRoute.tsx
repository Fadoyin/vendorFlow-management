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
  
  // Initialize with synchronous check to prevent loading flash
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    
    // Quick synchronous check
    if (!isAuthenticated()) return false
    
    const user = getStoredUser()
    if (!user) return false
    
    if (allowedRoles.length === 0) return true
    
    const userRole = user.role?.toLowerCase()
    return allowedRoles.some(role => role.toLowerCase() === userRole)
  })
  
  const [isLoading, setIsLoading] = useState(false) // Start as false since we have sync check

  useEffect(() => {
    const checkAccess = () => {
      // Re-verify access (this handles edge cases and ensures consistency)
      if (!isAuthenticated()) {
        setIsAuthorized(false)
        router.push('/auth?mode=login')
        return
      }

      const user = getStoredUser()
      if (!user) {
        setIsAuthorized(false)
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
        setIsAuthorized(false)
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

    // Only run the check if we don't already have a definitive answer
    if (isAuthorized === null) {
      checkAccess()
    }
  }, [router, pathname, allowedRoles, redirectTo, isAuthorized])

  // Show minimal loading state only if truly needed
  if (isLoading && isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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