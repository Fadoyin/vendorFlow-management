'use client'

// Temporarily disabled: import { useQuery } from '@tanstack/react-query'

// Temporary useQuery replacement
const useQuery = (key: any, fn: any, options?: any) => ({
  data: null,
  isLoading: false,
  error: null
})
import apiService from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

export function RecentActivity() {
  const { data: notifications } = useQuery<any[]>(
    ['recent-notifications'],
    () => apiService.getNotifications(undefined, undefined, undefined),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  )

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => apiService.getRecentOrders(),
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  const { data: recentVendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['recent-vendors'],
    queryFn: () => apiService.getRecentVendors(),
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'payment':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
          </div>
        )
      case 'forecast':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        )
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800'
      case 'dispatched':
        return 'bg-purple-100 text-purple-800'
      case 'enroute':
        return 'bg-indigo-100 text-indigo-800'
      case 'arrived':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
        <div className="space-y-4">
          {notifications && notifications.length > 0 ? (
            notifications.slice(0, 5).map((notification) => (
              <div key={notification._id} className="flex items-start space-x-3">
                {getActivityIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              </svg>
              <p className="mt-2 text-sm">No recent notifications</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-4">
          {recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order {order.orderId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm">No recent orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
