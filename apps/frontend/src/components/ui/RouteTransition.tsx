'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingWrapper, SkeletonDashboard } from './SkeletonLoader'

interface RouteTransitionProps {
  children: React.ReactNode
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const [mounted, setMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  
  // Always call hooks in the same order
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && pathname && pathname !== currentPath) {
      // Start transition immediately with content
      setCurrentPath(pathname)
      setIsTransitioning(true)
      
      // Brief transition for smooth feel, but show content immediately
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 100) // Much shorter delay, content shows immediately

      return () => clearTimeout(timer)
    }
  }, [pathname, currentPath, mounted])

  return (
    <div className="route-transition-container">
      {/* Show content immediately, just with a subtle transition */}
      <div 
        className={`transition-opacity duration-100 ${
          isTransitioning ? 'opacity-90' : 'opacity-100'
        }`}
      >
        {children}
      </div>
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