'use client'

import dynamic from 'next/dynamic'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'

// Loading component
function LoadingSpinner() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="mt-4 sm:mt-0">
            <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-md"></div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dynamic import of the actual vendor inventory content
const VendorInventoryContent = dynamic(() => import('./VendorInventoryContent'), {
  ssr: false,
  loading: () => <LoadingSpinner />
})

export default function VendorInventory() {
  return (
    <VendorRoute>
      <VendorInventoryContent />
    </VendorRoute>
  )
}
