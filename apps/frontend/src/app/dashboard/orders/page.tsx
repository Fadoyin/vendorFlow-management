'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { AdminRoute } from '@/components/auth/RoleProtectedRoute'
import { ordersApi, vendorsApi, suppliersApi, inventoryApi } from '@/lib/api'

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
}

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: any | null
}

// Order Detail Modal Component
function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && order?._id) {
      fetchOrderDetails()
    }
  }, [isOpen, order])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      console.log('Fetching order details for ID:', order._id)
      const response = await ordersApi.getById(order._id)
      console.log('Order details response:', response)
      
      if (response?.data) {
        console.log('Vendor data in response:', response.data.vendorId)
        console.log('Supplier data in response:', response.data.supplierId)
        setOrderDetails(response.data)
      } else {
        console.log('No data in response, using fallback order data')
        console.log('Fallback order vendor data:', order.vendorId)
        setOrderDetails(order)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      console.log('Using fallback order data due to error')
      console.log('Fallback order vendor data:', order.vendorId)
      setOrderDetails(order) // Fallback to basic order data
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !order) return null

  const orderData = orderDetails || order
  
  // Debug logging for order data
  console.log('Modal opened with order data:', {
    initialOrder: order,
    fetchedOrderDetails: orderDetails,
    finalOrderData: orderData,
    vendorInfo: {
      vendorId: orderData.vendorId,
      vendor: orderData.vendor,
      vendorDetails: orderData.vendorDetails
    },
    supplierInfo: {
      supplierId: orderData.supplierId,
      supplier: orderData.supplier,
      supplierDetails: orderData.supplierDetails
    }
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Order #{orderData.orderNumber || orderData.orderId || orderData._id?.slice(-8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Order Info</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Order ID:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {orderData.orderNumber || orderData.orderId || `#${orderData._id?.slice(-8)}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {new Date(orderData.orderDate || orderData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      orderData.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      orderData.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      orderData.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                      orderData.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {orderData.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Vendor Info</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Vendor:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {(() => {
                        // Enhanced vendor name resolution with debugging
                        const vendorName = orderData.vendorId?.name || 
                                         orderData.vendor?.name || 
                                         orderData.vendorDetails?.[0]?.name ||
                                         orderData.populatedVendor?.name;
                        
                        console.log('Vendor resolution debug:', {
                          vendorId: orderData.vendorId,
                          vendor: orderData.vendor,
                          vendorDetails: orderData.vendorDetails,
                          populatedVendor: orderData.populatedVendor,
                          resolvedName: vendorName
                        });
                        
                        return vendorName || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Code:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {(() => {
                        const vendorCode = orderData.vendorId?.vendorCode || 
                                         orderData.vendor?.vendorCode ||
                                         orderData.vendorDetails?.[0]?.vendorCode ||
                                         orderData.populatedVendor?.vendorCode;
                        return vendorCode || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {(() => {
                        const vendorId = orderData.vendorId?._id || 
                                       orderData.vendorId ||
                                       orderData.vendor?._id ||
                                       orderData.vendor;
                        return vendorId ? (typeof vendorId === 'string' ? vendorId.slice(-8) : vendorId.toString().slice(-8)) : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Supplier Info</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {(() => {
                        // Enhanced supplier name resolution with debugging
                        const supplierName = orderData.supplierId?.supplierName || 
                                            orderData.supplier?.name || 
                                            orderData.supplier?.supplierName ||
                                            orderData.supplierDetails?.[0]?.supplierName ||
                                            orderData.populatedSupplier?.supplierName;
                        
                        console.log('Supplier resolution debug:', {
                          supplierId: orderData.supplierId,
                          supplier: orderData.supplier,
                          supplierDetails: orderData.supplierDetails,
                          populatedSupplier: orderData.populatedSupplier,
                          resolvedName: supplierName
                        });
                        
                        return supplierName || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Code:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {(() => {
                        const supplierCode = orderData.supplierId?.supplierCode || 
                                            orderData.supplier?.code ||
                                            orderData.supplier?.supplierCode ||
                                            orderData.supplierDetails?.[0]?.supplierCode ||
                                            orderData.populatedSupplier?.supplierCode;
                        return supplierCode || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {(() => {
                        const supplierId = orderData.supplierId?._id || 
                                         orderData.supplierId ||
                                         orderData.supplier?._id ||
                                         orderData.supplier;
                        return supplierId ? (typeof supplierId === 'string' ? supplierId.slice(-8) : supplierId.toString().slice(-8)) : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderData.items?.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.itemName || item.stockName || item.name || 'Unknown Item'}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Totals */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${(orderData.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {orderData.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${(orderData.taxAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {orderData.shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">${(orderData.shippingCost || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {orderData.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-${(orderData.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${(orderData.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(orderData.notes || orderData.paymentTerms || orderData.expectedDeliveryDate) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderData.expectedDeliveryDate && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Expected Delivery:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(orderData.expectedDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {orderData.paymentTerms && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Terms:</span>
                      <p className="text-sm text-gray-900 mt-1">{orderData.paymentTerms}</p>
                    </div>
                  )}
                  {orderData.notes && (
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-600">Notes:</span>
                      <p className="text-sm text-gray-900 mt-1">{orderData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [formData, setFormData] = useState({
    vendorId: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
    taxAmount: 0,
    shippingCost: 0,
    discountAmount: 0
  })
  const [items, setItems] = useState([{ itemId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, notes: '' }])
  const [vendors, setVendors] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  const loadDropdownData = async () => {
    try {
      const [vendorsRes, suppliersRes, inventoryRes] = await Promise.all([
        vendorsApi.getAll({ page: 1, limit: 100 }),
        suppliersApi.getAll({ page: 1, limit: 100 }),
        inventoryApi.getAll({ page: 1, limit: 100 })
      ])
      setVendors((vendorsRes as any)?.data?.vendors || (vendorsRes as any)?.vendors || [])
      setSuppliers((suppliersRes as any)?.data?.suppliers || (suppliersRes as any)?.suppliers || [])
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
    
    // Auto-fill item details when inventory item is selected
    if (field === 'itemId' && value) {
      const selectedItem = inventoryItems.find(item => item._id === value)
      if (selectedItem) {
        updatedItems[index].itemName = selectedItem.name
        updatedItems[index].sku = selectedItem.sku
        updatedItems[index].unitPrice = selectedItem.pricing?.unitCost || 0
      }
    }
    
    setItems(updatedItems)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const tax = formData.taxAmount || 0
    const shipping = formData.shippingCost || 0
    const discount = formData.discountAmount || 0
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
      const { subtotal, total } = calculateTotals()
      
      const orderData = {
        orderId: `ORD-${Date.now()}`,
        vendorId: formData.vendorId || vendors[0]?._id,
        supplierId: formData.supplierId || suppliers[0]?._id,
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

      await ordersApi.create(orderData)
      
      // Reset form
      setFormData({
        vendorId: '',
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        notes: '',
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0
      })
      setItems([{ itemId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, notes: '' }])
      
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
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Order</h3>
                
                {/* Basic Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name} ({vendor.vendorCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} ({supplier.supplierCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                    <input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
                    <input
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Order Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border border-gray-200 rounded-lg">
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                          <select
                            value={item.itemId}
                            onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Item</option>
                            {inventoryItems.map(invItem => (
                              <option key={invItem._id} value={invItem._id}>
                                {invItem.name} ({invItem.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                          <div className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Optional"
                          />
                        </div>
                        
                        <div className="col-span-1">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-1 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Additional Costs</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.taxAmount}
                          onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.shippingCost}
                          onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discountAmount}
                          onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Order Summary</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes for this order..."
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default function OrdersOverview() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    loadOrders()
  }, [searchQuery, statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params: any = { page: 1, limit: 50 }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await ordersApi.getAll(params)
      
      if (response && ((response as any)?.data?.orders || (response as any)?.orders)) {
        setOrders((response as any)?.data?.orders || (response as any)?.orders)
        setError('')
      } else {
        setOrders([])
        setError('')
      }
    } catch (error) {
      console.error('Orders API error:', error)
      setError(`Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleOrderCreated = () => {
    loadOrders()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'placed':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const handleExportOrders = () => {
    try {
      const headers = ['Order ID', 'Vendor', 'Date', 'Status', 'Total Amount', 'Items Count']
      
      const csvData = orders.map(order => [
        order.orderId || order._id || '',
        order.vendorId?.name || 'N/A',
        new Date(order.orderDate).toLocaleDateString(),
        order.status || '',
        order.totalAmount?.toFixed(2) || '0.00',
        order.items?.length || 0
      ])

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting orders:', error)
      alert('Failed to export orders. Please try again.')
    }
  }

  return (
    <DashboardLayout title="Orders Management" description="Track and manage your purchase orders">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex-1">
            {/* Title is handled by DashboardLayout, no duplication needed */}
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Order</span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-600 mt-1">{orders.length} total orders</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <span>Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-red-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Error loading orders: {error}</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>No orders found</span>
                        <p className="text-sm text-gray-400 mt-1">Create your first order to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                #{order.orderNumber?.slice(-4) || order._id.slice(-4)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Order #{order.orderNumber || order._id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.vendorId?.name || order.vendor?.name || order.supplierId?.supplierName || order.supplier?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Order Modal */}
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={handleOrderCreated}
        />

        {/* Order Detail Modal */}
        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      </div>
    </DashboardLayout>
  )
}
