'use client'

import { useState, useEffect } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { logout } from '@/lib/auth-utils'


interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, role } = useUserRole()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
  }

  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-3 min-w-[44px] min-h-[44px] text-gray-500 hover:text-gray-600 lg:hidden flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">VendorFlow</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-3 min-w-[44px] min-h-[44px] text-gray-500 hover:text-gray-600 lg:hidden flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VF</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">VendorFlow</h1>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm text-gray-900 font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email
                      }
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1 capitalize">
                      {role || 'User'}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {role === 'supplier' && (
                      <a
                        href="/dashboard/supplier/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit Profile
                      </a>
                    )}
                    {role === 'vendor' && (
                      <a
                        href="/dashboard/vendor/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit Profile
                      </a>
                    )}
                    {role === 'admin' && (
                      <a
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </a>
                    )}
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
