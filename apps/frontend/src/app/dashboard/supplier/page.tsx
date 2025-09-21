'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { SubscriptionAndInventoryCard } from '@/components/dashboard/SubscriptionAndInventoryCard'
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
        const ordersData = (ordersResponse.data as any).orders || (ordersResponse.data as any).data || ordersResponse.data
        
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

        {/* Subscription and Inventory Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SubscriptionAndInventoryCard />
          </div>
          
          {/* Recent Orders - takes up remaining space */}
          <div className="lg:col-span-2">
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
                {dashboardData?.recentOrders?.length ? (
                  dashboardData.recentOrders.map((order, index) => (
                    <li key={order._id || index}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {order.orderId || order.id}
                                </p>
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                                  order.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-gray-600">
                                  {order.items?.[0]?.stockName || order.items?.[0]?.itemName || 'Items'} 
                                  {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.urgency && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.urgency === 'high' 
                                  ? 'bg-red-100 text-red-800'
                                  : order.urgency === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {order.urgency}
                              </span>
                            )}
                            <Link 
                              href={`/dashboard/supplier/orders`}
                              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <div className="px-4 py-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                      <p className="mt-1 text-sm text-gray-500">You don't have any orders yet.</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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


              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
