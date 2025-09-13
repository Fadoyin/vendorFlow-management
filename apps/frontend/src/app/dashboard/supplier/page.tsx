'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { ordersApi } from '@/lib/api'

interface DashboardStats {
  totalOrders: number
  pending: number
  inProgress: number
  completed: number
}

interface RecentOrder {
  _id: string
  id: string
  orderId: string
  items: Array<{
    stockName: string
    itemName?: string
  }>
  status: string
  createdAt: string
  orderDate: string
  urgency?: string
}

export default function SupplierDashboard() {
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats
    recentOrders: RecentOrder[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user from localStorage to understand the context
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      console.log('Current user:', user)

      // Fetch orders statistics and recent orders in parallel
      const [statsResponse, ordersResponse] = await Promise.all([
        ordersApi.getStats(),
        ordersApi.getAll({ 
          page: 1, 
          limit: 5, 
          sortBy: 'createdAt', 
          sortOrder: 'desc' 
        })
      ])

      console.log('Stats response:', statsResponse)
      console.log('Orders response:', ordersResponse)

      // Process statistics data
      let stats: DashboardStats = {
        totalOrders: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
      }

      if (statsResponse?.data) {
        // Handle different possible response structures
        const statsData = statsResponse.data.stats || statsResponse.data
        
        if (Array.isArray(statsData)) {
          // If stats is an array (aggregation result)
          statsData.forEach((stat: any) => {
            switch (stat._id?.toLowerCase()) {
              case 'pending':
                stats.pending = stat.count || 0
                break
              case 'in progress':
              case 'inprogress':
              case 'in_progress':
                stats.inProgress = stat.count || 0
                break
              case 'completed':
                stats.completed = stat.count || 0
                break
            }
          })
          stats.totalOrders = stats.pending + stats.inProgress + stats.completed
        } else if (typeof statsData === 'object') {
          // If stats is an object with direct properties
          stats = {
            totalOrders: statsData.totalOrders || statsData.total || 0,
            pending: statsData.pending || 0,
            inProgress: statsData.inProgress || statsData.in_progress || 0,
            completed: statsData.completed || 0
          }
        }
      }

      // Process recent orders data
      let recentOrders: RecentOrder[] = []
      
      if (ordersResponse?.data) {
        const ordersData = ordersResponse.data.orders || ordersResponse.data.data || ordersResponse.data
        
        if (Array.isArray(ordersData)) {
          recentOrders = ordersData.slice(0, 5).map((order: any) => ({
            _id: order._id,
            id: order.orderId || order.id || `#ORD-${order._id?.slice(-6) || 'UNKNOWN'}`,
            orderId: order.orderId || order.id || `#ORD-${order._id?.slice(-6) || 'UNKNOWN'}`,
            items: order.items || [],
            status: order.status || 'Unknown',
            createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
            orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
            urgency: order.priority || order.urgency || 'Medium'
          }))
        }
      }

      console.log('Processed stats:', stats)
      console.log('Processed recent orders:', recentOrders)

      setDashboardData({ stats, recentOrders })

    } catch (err) {
      console.error('Dashboard data error:', err)
      setError('Failed to load dashboard data. Please try again.')
      
      // Set empty data instead of mock data when there's an error
      setDashboardData({
        stats: {
          totalOrders: 0,
          pending: 0,
          inProgress: 0,
          completed: 0
        },
        recentOrders: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Format the item name from the order data
  const getOrderItemName = (order: RecentOrder): string => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0]
      return firstItem.stockName || firstItem.itemName || 'Unknown Item'
    }
    return 'No Items'
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Use real data or empty array if no data available
  const recentOrders = dashboardData?.recentOrders || []

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in progress':
      case 'inprogress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'in transit':
      case 'intransit':
      case 'in_transit':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Supplier Dashboard" description="Manage your supplier operations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Supplier Dashboard" description="Manage your supplier operations">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
                <button
                  onClick={loadDashboardData}
                  className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.stats?.totalOrders || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.stats?.pending || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.stats?.inProgress || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.stats?.completed || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest orders from the database</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <li key={order._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getOrderItemName(order)}</div>
                          <div className="text-sm text-gray-500">Order {order.id}</div>
                          {order.items.length > 1 && (
                            <div className="text-xs text-gray-400">+{order.items.length - 1} more items</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="px-4 py-12 sm:px-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent orders</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first order.</p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/supplier/orders"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create New Order
                    </Link>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/supplier/orders"
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Manage Orders
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      View and manage all your supplier orders
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                    </svg>
                  </span>
                </Link>

                <Link
                  href="/dashboard/supplier/profile"
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Supplier Profile
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Update your supplier information and settings
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                    </svg>
                  </span>
                </Link>

                <Link
                  href="/dashboard/supplier/analytics"
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Analytics
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      View detailed analytics and reports
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
