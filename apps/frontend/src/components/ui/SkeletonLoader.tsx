import React from 'react'

interface SkeletonProps {
  className?: string
  rows?: number
  height?: string
}

export function Skeleton({ className = '', height = 'h-4' }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${height} ${className}`}
    />
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5" />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
          {Array.from({ length: 5 }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats skeleton */}
      <SkeletonStats />

      {/* Charts and content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <SkeletonTable />
      </div>
    </div>
  )
}

// Loading wrapper component
interface LoadingWrapperProps {
  isLoading: boolean
  skeleton?: React.ReactNode
  children: React.ReactNode
  delay?: number
}

export function LoadingWrapper({ 
  isLoading, 
  skeleton, 
  children,
  delay = 200 
}: LoadingWrapperProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(false)

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowSkeleton(true), delay)
      return () => clearTimeout(timer)
    } else {
      setShowSkeleton(false)
    }
  }, [isLoading, delay])

  if (isLoading && showSkeleton) {
    return <>{skeleton || <SkeletonDashboard />}</>
  }

  if (isLoading) {
    // Show a simple spinner for very short loads
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
} 