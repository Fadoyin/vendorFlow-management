'use client'

import { useState, useEffect, useCallback } from 'react'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { vendorApi } from '@/lib/api'
import CreateOrderModal from '@/components/orders/CreateOrderModal'
import { useUserRole } from '@/hooks/useUserRole'

interface OrderStats {
  totalOrders: number;
  pending: number;
  completed: number;
  revenue: number;
}

interface Order {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  items: number;
}

interface OrdersData {
  stats: OrderStats;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function VendorOrders() {
  const { user } = useUserRole();
  const [ordersData, setOrdersData] = useState<OrdersData>({
    stats: { totalOrders: 0, pending: 0, completed: 0, revenue: 0 },
    orders: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  const loadOrders = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: currentPage,
        limit: 20,
        ...params,
      };

      if (searchQuery) {
        queryParams.search = searchQuery;
      }

      if (statusFilter !== 'all') {
        queryParams.status = statusFilter;
      }

      console.log('👤 Current user:', user);
      console.log('🔍 Loading orders with params:', queryParams);
      const response = await vendorApi.getOrders(queryParams);
      
                  console.log('📦 Vendor orders API response:', response);
            console.log('📊 Response data:', response.data);
            
            if (response.data) {
              console.log('✅ Setting orders data:', {
                statsTotal: response.data.stats?.totalOrders,
                ordersCount: response.data.orders?.length,
                firstOrder: response.data.orders?.[0]
              });
              setOrdersData(response.data);
            } else {
              console.log('❌ No data in response');
            }
    } catch (err) {
      console.error('❌ Error loading orders:', err);
      console.error('❌ Error details:', {
        message: (err as any)?.message,
        response: (err as any)?.response,
        stack: (err as any)?.stack
      });
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    console.log('🔄 VendorOrders component mounted, loading orders...');
    

    
    loadOrders();
  }, [loadOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrders();
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && ordersData.orders.length === 0) {
    return (
      <VendorRoute>
        <DashboardLayout title="Orders" description="Manage your orders and track fulfillment">
          <div className="space-y-6">
            {/* Loading skeleton */}
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <div className="h-8 bg-gray-300 rounded w-64 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-96 mt-2 animate-pulse"></div>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg p-5">
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
              ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white shadow rounded-lg overflow-hidden p-6">
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
        </DashboardLayout>
      </VendorRoute>
    );
  }

  return (
    <VendorRoute>
      <DashboardLayout title="Orders" description="Track and manage all your orders from customers">
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <button
                    onClick={() => loadOrders()}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateOrderModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Order
              </button>
              <button
                type="button"
                onClick={() => loadOrders()}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">{ordersData.stats.totalOrders.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-lg font-medium text-gray-900">{ordersData.stats.pending.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">{ordersData.stats.completed.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(ordersData.stats.revenue)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search Orders
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search by order ID or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Orders Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Orders</h3>
                <p className="mt-1 text-sm text-gray-500 sm:mt-0">
                  {ordersData.orders.length} of {ordersData.pagination.total} orders
                </p>
              </div>



              {loading ? (
                <div className="animate-pulse">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-16 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ordersData.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                                <div className="text-sm text-gray-500">{order.items} items</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(order.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => console.log('View order:', order.id)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => console.log('Edit order:', order.id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => console.log('Cancel order:', order.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {ordersData.pagination.pages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= ordersData.pagination.pages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing{' '}
                            <span className="font-medium">
                              {(currentPage - 1) * ordersData.pagination.limit + 1}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * ordersData.pagination.limit, ordersData.pagination.total)}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium">{ordersData.pagination.total}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, ordersData.pagination.pages) }, (_, i) => {
                              const page = Math.max(1, Math.min(
                                ordersData.pagination.pages - 4,
                                Math.max(1, currentPage - 2)
                              )) + i;
                              
                              if (page > ordersData.pagination.pages) return null;
                              
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === currentPage
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= ordersData.pagination.pages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {ordersData.orders.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Orders will appear here once customers place them.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        onSuccess={() => {
          setShowCreateOrderModal(false)
          loadOrders() // Refresh the orders list
        }}
      />
    </VendorRoute>
  )
}
