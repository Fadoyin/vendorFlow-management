'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingWrapper, SkeletonDashboard } from './SkeletonLoader'

interface RouteTransitionProps {
  children: React.ReactNode
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== currentPath) {
      // Start transition
      setIsTransitioning(true)
      
      // Short delay to show loading state, then switch content
      const timer = setTimeout(() => {
        setCurrentPath(pathname)
        setIsTransitioning(false)
      }, 150) // Very short delay for snappy feeling

      return () => clearTimeout(timer)
    }
  }, [pathname, currentPath])

  return (
    <div className="route-transition-container">
      <LoadingWrapper 
        isLoading={isTransitioning}
        skeleton={<SkeletonDashboard />}
        delay={100} // Show skeleton quickly
      >
        <div 
          className={`transition-opacity duration-200 ${
            isTransitioning ? 'opacity-50' : 'opacity-100'
          }`}
        >
          {children}
        </div>
      </LoadingWrapper>
    </div>
  )
}

// Page wrapper with optimizations
interface OptimizedPageProps {
  children: React.ReactNode
  title?: string
  description?: string
  loading?: boolean
  skeleton?: React.ReactNode
}

export function OptimizedPage({ 
  children, 
  title, 
  description,
  loading = false,
  skeleton 
}: OptimizedPageProps) {
  // Set page title
  useEffect(() => {
    if (title) {
      document.title = `${title} - VendorFlow`
    }
  }, [title])

  return (
    <div className="optimized-page">
      {/* Page header with title and description */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
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

      {/* Page content with loading wrapper */}
      <LoadingWrapper 
        isLoading={loading}
        skeleton={skeleton}
        delay={150}
      >
        {children}
      </LoadingWrapper>
    </div>
  )
} 