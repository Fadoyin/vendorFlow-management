import { useState, useEffect } from 'react'
import { getStoredUser, type User } from '@/lib/auth-utils'

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getStoredUser()
    setUser(currentUser)
    setRole(currentUser?.role || null)
    setLoading(false)
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