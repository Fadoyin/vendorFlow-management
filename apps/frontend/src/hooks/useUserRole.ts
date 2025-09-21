import { useState, useEffect } from 'react'
import { getStoredUser, type User } from '@/lib/auth-utils'

// Cache for user data to avoid multiple localStorage reads
let userCache: { user: User | null; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedUser(): User | null {
  // Check if we have valid cache
  if (userCache && (Date.now() - userCache.timestamp) < CACHE_DURATION) {
    return userCache.user
  }
  
  // Cache is stale or doesn't exist, refresh it
  const user = getStoredUser()
  userCache = { user, timestamp: Date.now() }
  return user
}

function getInitialRole(): string | null {
  if (typeof window === 'undefined') return null
  
  // Use cached user data for immediate role detection
  const user = getCachedUser()
  return user?.role || null
}

export function useUserRole() {
  // Initialize with null to ensure consistent server/client rendering
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize user data after mounting to avoid hydration mismatch
    const currentUser = getStoredUser()
    setUser(currentUser)
    setRole(currentUser?.role || null)
    setLoading(false)
    
    // Update cache
    userCache = { user: currentUser, timestamp: Date.now() }
      }, [])

  // Listen for storage changes (when user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'mockUserData') {
        // Clear cache and refresh
        userCache = null
        const newUser = getCachedUser()
        setUser(newUser)
        setRole(newUser?.role || null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return {
    user,
    role,
    loading,
    isAdmin: role === 'admin',
    isVendor: role === 'vendor',
    isSupplier: role === 'supplier',
  }
}

// Export function to clear cache when user logs out
export function clearUserCache() {
  userCache = null
}

// Export function to get role synchronously without hooks
export function getUserRoleSync(): string | null {
  return getInitialRole()
} 