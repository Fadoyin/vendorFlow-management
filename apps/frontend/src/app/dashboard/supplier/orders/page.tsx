'use client';

import { useState, useEffect } from 'react';
import { SupplierDashboardLayout } from '@/components/ui/ProtectedDashboardLayout'
import { Pagination } from '@/components/ui/Pagination'
import { ordersApi, vendorsApi, inventoryApi } from '@/lib/api'

interface Order {
  _id: string;
  orderId: string;
  orderNumber?: string;
  items: Array<{
    stockName: string;
    itemName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  status: string;
  createdAt: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  expectedArrivalDate?: string; // Backend uses this field name
  totalAmount: number;
  currency?: string;
  vendorId?: string | {
    _id: string;
    name: string;
    vendorCode?: string;
  };
  supplierId?: string;
  priority?: string;
  notes?: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
}

export default function SupplierOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadOrders();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  // Debounced search and filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching/filtering
      loadOrders();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading orders with filters:', { statusFilter, searchTerm });

      // Build query parameters
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      // Add status filter if selected
      if (statusFilter) {
        params.status = statusFilter;
      }

      // Add search query if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log('API params:', params);

      // Fetch orders from backend
      const response = await ordersApi.getAll(params);
      
      console.log('Orders API response:', response);

      // Process the response
      let ordersData: Order[] = [];
      let total = 0;
      
      if (response?.data) {
        const responseData = response.data as any;
        
        if (Array.isArray(responseData)) {
          // Simple array response
          ordersData = responseData;
          total = responseData.length;
        } else if (responseData.orders) {
          // Paginated response with orders and total
          ordersData = responseData.orders;
          total = responseData.total || responseData.totalCount || 0;
        } else if (responseData.data) {
          // Alternative structure
          ordersData = responseData.data;
          total = responseData.total || responseData.totalCount || 0;
        }
        
        // Map orders to our format
        const mappedOrders = ordersData.map((order: any) => ({
          _id: order._id,
          orderId: order.orderId || order.id || `#ORD-${order._id ? String(order._id).slice(-6) : 'UNKNOWN'}`,
          orderNumber: order.orderNumber || order.orderId || order.id,
          items: order.items || [],
          status: order.status || 'Unknown',
          createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
          orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
          expectedDeliveryDate: order.expectedDeliveryDate,
          expectedArrivalDate: order.expectedArrivalDate,
          totalAmount: order.totalAmount || 0,
          currency: order.currency || 'USD',
          vendorId: order.vendorId,
          supplierId: order.supplierId,
          priority: order.priority || order.urgency || 'Medium',
          notes: order.notes,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          discount: order.discount
        }));

        console.log('Processed orders:', mappedOrders);
        setOrders(mappedOrders);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(0);
      }

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please check your connection and try again.');
      // Don't clear orders on error, keep showing previous data
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleOrderCreated = () => {
    // Refresh the orders list after creating a new order
    console.log('Order created, refreshing list...');
    loadOrders();
  };

  // Helper functions for display
  const getOrderItemName = (order: Order): string => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      return firstItem.stockName || firstItem.itemName || 'Unknown Item';
    }
    return 'No Items';
  };

  const getCustomerName = (order: Order): string => {
    // In a supplier context, the "customer" would be the vendor
    if (order.vendorId) {
      // Check if vendorId is populated with vendor details
      if (typeof order.vendorId === 'object' && order.vendorId.name) {
        return order.vendorId.name;
      }
      // Fallback to vendor ID if not populated
      const vendorIdStr = typeof order.vendorId === 'string' ? order.vendorId : String(order.vendorId);
      return `Vendor ${vendorIdStr.slice(-6)}`;
    }
    return 'Unknown Vendor';
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
      case 'placed':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
      case 'inprogress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'in transit':
      case 'intransit':
      case 'in_transit':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <SupplierDashboardLayout title="Orders" description="Manage your orders and create new orders">
      <div className="space-y-6">
        {/* Header with Create Order Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={loadOrders}
                  className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                id="searchQuery"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order ID, Customer, or Item..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={loadOrders}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getOrderItemName(order)}</div>
                          {order.items.length > 1 && (
                            <div className="text-xs text-gray-500">+{order.items.length - 1} more items</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getCustomerName(order)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.expectedDeliveryDate || order.expectedArrivalDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(order.priority)}`}>
                            {order.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {searchTerm || statusFilter === 'all' ? 'No orders match your filters' : 'No orders found'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || statusFilter === 'all' 
                              ? 'Try adjusting your search criteria or filters.'
                              : 'Get started by creating your first order.'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      </div>
    </SupplierDashboardLayout>
  );
} 