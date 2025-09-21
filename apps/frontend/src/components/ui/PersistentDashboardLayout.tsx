'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'

interface PersistentDashboardLayoutProps {
  children: ReactNode
}

// Global sidebar state that persists across route changes
let persistentSidebarState = {
  isOpen: false,
  listeners: new Set<(isOpen: boolean) => void>(),
  
  setOpen: (isOpen: boolean) => {
    persistentSidebarState.isOpen = isOpen
    persistentSidebarState.listeners.forEach(listener => listener(isOpen))
  },
  
  subscribe: (listener: (isOpen: boolean) => void) => {
    persistentSidebarState.listeners.add(listener)
    return () => {
      persistentSidebarState.listeners.delete(listener)
    }
  }
}

export function PersistentDashboardLayout({ children }: PersistentDashboardLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(persistentSidebarState.isOpen)
  
  // Always call hooks in the same order
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Subscribe to global sidebar state changes
  useEffect(() => {
    return persistentSidebarState.subscribe(setSidebarOpen)
  }, [])
  
  // Check if we're on a dashboard route (only after mounting)
  const isDashboardRoute = mounted && pathname.startsWith('/dashboard')

  if (!mounted || !isDashboardRoute) {
    return <>{children}</>
  }

  const handleSidebarToggle = (open: boolean) => {
    persistentSidebarState.setOpen(open)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - spans full width */}
      <DashboardHeader onMenuClick={() => handleSidebarToggle(true)} />
      
      {/* Main Container - accounts for fixed header */}
      <div className="flex h-screen pt-16">
        {/* Persistent Sidebar - never unmounts during navigation */}
        <div className="sidebar-container">
          <DashboardSidebar 
            isOpen={sidebarOpen} 
            setIsOpen={handleSidebarToggle}
          />
        </div>

        {/* Main Content Area - where page content renders */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="h-full">
            {/* Page content without additional transitions */}
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile backdrop - persistent across routes */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => handleSidebarToggle(false)}
        />
      )}
    </div>
  )
}

// Hook to access sidebar state from any component
export function usePersistentSidebar() {
  const [isOpen, setIsOpen] = useState(persistentSidebarState.isOpen)

  useEffect(() => {
    return persistentSidebarState.subscribe(setIsOpen)
  }, [])

  return {
    isOpen,
    setOpen: persistentSidebarState.setOpen,
    toggle: () => persistentSidebarState.setOpen(!persistentSidebarState.isOpen)
  }
} 