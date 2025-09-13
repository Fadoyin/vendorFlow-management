'use client';

import { useState, useEffect } from 'react';
import { SupplierDashboardLayout } from '@/components/ui/ProtectedDashboardLayout'
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
  totalAmount: number;
  currency?: string;
  vendorId?: string;
  supplierId?: string;
  priority?: string;
  notes?: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [formData, setFormData] = useState({
    vendorId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
    taxAmount: 0,
    shippingCost: 0,
    discountAmount: 0
  })
  const [items, setItems] = useState([{ itemId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, notes: '' }])
  const [vendors, setVendors] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  const loadDropdownData = async () => {
    try {
      const [vendorsRes, inventoryRes] = await Promise.all([
        vendorsApi.getAll({ page: 1, limit: 100 }),
        inventoryApi.getAll({ page: 1, limit: 100 })
      ])
      setVendors((vendorsRes as any)?.data?.vendors || (vendorsRes as any)?.vendors || [])
      setInventoryItems((inventoryRes as any)?.data?.items || (inventoryRes as any)?.items || [])
    } catch (error) {
      console.error('Error loading dropdown data:', error)
    }
  }

  const addItem = () => {
    setItems([...items, { itemId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, notes: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Auto-fill item details when itemId is selected
    if (field === 'itemId' && value) {
      const selectedItem = inventoryItems.find(item => item._id === value)
      if (selectedItem) {
        updatedItems[index].itemName = selectedItem.name
        updatedItems[index].sku = selectedItem.sku
        updatedItems[index].unitPrice = selectedItem.price || 0
      }
    }
    
    setItems(updatedItems)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const tax = (subtotal * (formData.taxAmount / 100))
    const shipping = formData.shippingCost
    const discount = formData.discountAmount
    const total = subtotal + tax + shipping - discount

    return { subtotal, tax, shipping, discount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.filter(item => item.itemId).length === 0) {
      alert('Please add at least one item to the order')
      return
    }

    setIsSubmitting(true)
    
    try {
      const { total } = calculateTotals()
      
      // Get current user to extract supplierId
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      const orderData = {
        orderId: `ORD-${Date.now()}`,
        vendorId: formData.vendorId,
        supplierId: user.id || user._id, // Current supplier's ID
        status: 'placed',
        orderDate: formData.orderDate ? new Date(formData.orderDate).toISOString() : new Date().toISOString(),
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate).toISOString() : undefined,
        items: items.filter(item => item.itemId).map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || ''
        })),
        taxAmount: formData.taxAmount || 0,
        shippingCost: formData.shippingCost || 0,
        discountAmount: formData.discountAmount || 0,
        notes: formData.notes || ''
      }

      console.log('Creating order with data:', orderData)
      await ordersApi.create(orderData)
      
      // Reset form
      setFormData({
        vendorId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        notes: '',
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0
      })
      setItems([{ itemId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, notes: '' }])
      
      alert('Order created successfully!')
      onOrderCreated()
      onClose()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const { subtotal, tax, shipping, discount, total } = calculateTotals()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Order</h3>
                  
                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                      <select
                        value={formData.vendorId}
                        onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                        required
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor._id} value={vendor._id}>
                            {vendor.name || vendor.companyName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                      <input
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate}
                        onChange={(e) => setFormData({...formData, expectedDeliveryDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-medium text-gray-900">Order Items</h4>
                      <button
                        type="button"
                        onClick={addItem}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add Item
                      </button>
                    </div>

                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 p-3 border rounded">
                        <div>
                          <select
                            value={item.itemId}
                            onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            required
                          >
                            <option value="">Select Item</option>
                            {inventoryItems.map((invItem) => (
                              <option key={invItem._id} value={invItem._id}>
                                {invItem.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Unit Price"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Notes"
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            disabled={items.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax (%)</label>
                      <input
                        type="number"
                        value={formData.taxAmount}
                        onChange={(e) => setFormData({...formData, taxAmount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost ($)</label>
                      <input
                        type="number"
                        value={formData.shippingCost}
                        onChange={(e) => setFormData({...formData, shippingCost: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount ($)</label>
                      <input
                        type="number"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Any special instructions or notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  // Debounced search and filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOrders();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading orders with filters:', { statusFilter, searchQuery });

      // Build query parameters
      const params: any = {
        page: 1,
        limit: 100, // Load more orders for better UX
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Add status filter if selected
      if (statusFilter) {
        params.status = statusFilter;
      }

      // Add search query if provided
      if (searchQuery) {
        params.search = searchQuery;
      }

      console.log('API params:', params);

      // Fetch orders from backend
      const response = await ordersApi.getAll(params);
      
      console.log('Orders API response:', response);

      // Process the response
      let ordersData: Order[] = [];
      
      if (response?.data) {
        const rawData = response.data.orders || response.data.data || response.data;
        
        if (Array.isArray(rawData)) {
          ordersData = rawData.map((order: any) => ({
            _id: order._id,
            orderId: order.orderId || order.id || `#ORD-${order._id ? String(order._id).slice(-6) : 'UNKNOWN'}`,
            orderNumber: order.orderNumber || order.orderId || order.id,
            items: order.items || [],
            status: order.status || 'Unknown',
            createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
            orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
            expectedDeliveryDate: order.expectedDeliveryDate,
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
        }
      }

      console.log('Processed orders:', ordersData);
      setOrders(ordersData);

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please check your connection and try again.');
      // Don't clear orders on error, keep showing previous data
    } finally {
      setLoading(false);
    }
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
    // For now, we'll show "Vendor" or the vendor ID
    if (order.vendorId) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Order
          </button>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option value="">All Statuses</option>
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
                          {formatDate(order.expectedDeliveryDate)}
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
                            {searchQuery || statusFilter ? 'No orders match your filters' : 'No orders found'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchQuery || statusFilter 
                              ? 'Try adjusting your search criteria or filters.'
                              : 'Get started by creating your first order.'
                            }
                          </p>
                          {!searchQuery && !statusFilter && (
                            <div className="mt-6">
                              <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create Your First Order
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrderCreated={handleOrderCreated}
      />
    </SupplierDashboardLayout>
  );
} 