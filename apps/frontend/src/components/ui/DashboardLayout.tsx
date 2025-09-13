'use client'

import React, { useState } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'
import { RouteTransition } from './RouteTransition'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - spans full width */}
      <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Main Container - accounts for fixed header */}
      <div className="flex h-screen pt-16">
        {/* Sidebar - positioned relative on desktop for proper flex behavior */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen}
        />

        {/* Main Content - flexbox automatically adjusts width */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="h-full">
            <div className="p-4 sm:p-6 lg:p-8">
              <RouteTransition>
                {/* Page header */}
                {(title || description) && (
                  <div className="mb-6">
                    {title && (
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="text-gray-600">
                        {description}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Page content */}
                <div className="max-w-full">
                  {children}
                </div>
              </RouteTransition>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
} 