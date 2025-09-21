'use client'

import React from 'react'
import { RouteTransition } from './RouteTransition'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Only wrap the page content in a subtle transition */}
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
  )
} 