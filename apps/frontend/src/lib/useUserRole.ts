import { useState, useEffect } from 'react'

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const getUserRole = () => {
      try {
        if (typeof window !== 'undefined') {
          // Check multiple possible storage keys for user data
          let userData = null
          
          // Try 'user' key first (current login system)
          const userString = localStorage.getItem('user')
          if (userString) {
            userData = JSON.parse(userString)
          } else {
            // Fallback to 'userData' key
            const userDataString = localStorage.getItem('userData')
            if (userDataString) {
              userData = JSON.parse(userDataString)
            } else {
              // Fallback to 'mockUserData' for testing
              const mockUserDataString = localStorage.getItem('mockUserData')
              if (mockUserDataString) {
                userData = JSON.parse(mockUserDataString)
              }
            }
          }
          
          if (userData && userData.role) {
            return userData.role.toLowerCase()
          }
        }
        return null
      } catch (error) {
        console.error('Error parsing user data:', error)
        return null
      }
    }

    const userRole = getUserRole()
    setRole(userRole)
    setIsLoading(false)
  }, [])

  // Return default values during SSR to prevent hydration mismatch
  if (!isMounted) {
    return {
      role: null,
      isLoading: true,
      isMounted: false
    }
  }

  return {
    role,
    isLoading,
    isMounted
  }
} 