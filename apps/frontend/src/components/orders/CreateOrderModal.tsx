'use client'

import { useState, useEffect } from 'react'
import { apiService, suppliersApi, vendorsApi } from '@/lib/api'
import { useUserRole } from '@/hooks/useUserRole'

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface InventoryItem {
  _id: string
  name: string
  sku: string
  description?: string
  pricing: {
    costPrice: number
    sellingPrice?: number
    currency: string
  }
  inventory: {
    currentStock: number
    availableStock: number
    stockUnit: string
  }
  category: string
  unitOfMeasure: string
}

interface Vendor {
  _id: string
  name?: string
  vendorName?: string
  firstName?: string
  lastName?: string
  email?: string
  contacts?: Array<{
    name: string
    email: string
    isPrimary?: boolean
  }>
  companyName?: string
  status?: string
}

interface Supplier {
  _id: string
  supplierName: string
  supplierCode: string
  category: string
  status: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  contactPerson?: string
  contactEmail?: string
}

interface OrderItem {
  id: string
  itemId: string // MongoDB ID for inventory item
  itemName: string
  sku: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface OrderFormData {
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  items: OrderItem[]
  notes: string
  priority: 'low' | 'medium' | 'high'
  expectedDeliveryDate: string
}



export default function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    items: [],
    notes: '',
    priority: 'medium',
    expectedDeliveryDate: ''
  })

  const [currentItem, setCurrentItem] = useState({
    selectedInventoryId: '',
    quantity: 1,
    unitPrice: 0
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('supplier')
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }
  
  // Dropdown data
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loadingData, setLoadingData] = useState(false)
  
  // Selection based on user role
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  
  // Get user role to determine what to load
  const { role: userRole } = useUserRole()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
      // Reset form to initial state
      setActiveTab('supplier')
      setError('')
      setSuccess('')
      setSelectedSupplierId('')
      setSelectedVendorId('')
      setFormData({
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        items: [],
        notes: '',
        priority: 'medium',
        expectedDeliveryDate: ''
      })
      setCurrentItem({
        selectedInventoryId: '',
        quantity: 1,
        unitPrice: 0
      })
    }
  }, [isOpen])
  


  const loadDropdownData = async () => {
    setLoadingData(true)
    try {
      // Load inventory items
      const inventoryResponse = await apiService.request('inventory')
      if (inventoryResponse.data?.items) {
        setInventoryItems(inventoryResponse.data.items)
      }

      // Load different data based on user role
      if (userRole === 'vendor') {
        // Vendors create orders for suppliers
        const suppliersResponse = await suppliersApi.getAll({ page: 1, limit: 100 })
        
        // Handle different response structures
        let parsedSuppliers = []
        const responseData = suppliersResponse as any
        
        if (responseData.data && responseData.data.suppliers) {
          parsedSuppliers = responseData.data.suppliers || []
        } else if (responseData.suppliers) {
          parsedSuppliers = responseData.suppliers || []
        } else if (responseData.data && Array.isArray(responseData.data)) {
          parsedSuppliers = responseData.data || []
        } else if (Array.isArray(responseData)) {
          parsedSuppliers = responseData || []
        } else {
          console.warn('Unexpected suppliers response structure. Keys:', Object.keys(responseData))
          parsedSuppliers = []
        }

        setSuppliers(parsedSuppliers)
        console.log(`Suppliers loaded for vendor: ${parsedSuppliers.length} found`)
        
      } else if (userRole === 'supplier') {
        // Suppliers create orders for vendors
        const vendorsResponse = await vendorsApi.getAll({ page: 1, limit: 100 })
        
        // Handle different response structures
        let parsedVendors = []
        const responseData = vendorsResponse as any
        
        if (responseData.data && responseData.data.vendors) {
          parsedVendors = responseData.data.vendors || []
        } else if (responseData.vendors) {
          parsedVendors = responseData.vendors || []
        } else if (responseData.data && Array.isArray(responseData.data)) {
          parsedVendors = responseData.data || []
        } else if (Array.isArray(responseData)) {
          parsedVendors = responseData || []
        } else {
          console.warn('Unexpected vendors response structure. Keys:', Object.keys(responseData))
          parsedVendors = []
        }

        setVendors(parsedVendors)
        console.log(`Vendors loaded for supplier: ${parsedVendors.length} found`)
        if (parsedVendors.length > 0) {
          const firstVendor = parsedVendors[0]
          const vendorName = firstVendor.name || firstVendor.vendorName || 'Unknown'
          const vendorEmail = firstVendor.email || firstVendor.contacts?.[0]?.email || 'No email'
          console.log(`First vendor: ${vendorName} (${vendorEmail})`)
        }
      }

    } catch (error) {
      console.error('Error loading dropdown data:', error)
      setSuppliers([])
      setVendors([])
    } finally {
      setLoadingData(false)
    }
  }

  const addItem = () => {
    if (!currentItem.selectedInventoryId || currentItem.quantity <= 0 || currentItem.unitPrice <= 0) {
      setError('Please select an item and fill in all details with valid values.')
      return
    }

    const selectedInventoryItem = inventoryItems.find(item => item._id === currentItem.selectedInventoryId)
    if (!selectedInventoryItem) {
      setError('Selected inventory item not found.')
      return
    }

    // Check if item already exists in the order
    const existingItemIndex = formData.items.findIndex(item => item.itemId === currentItem.selectedInventoryId)
    
    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex].quantity += currentItem.quantity
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }))
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: currentItem.selectedInventoryId,
        itemName: selectedInventoryItem.name,
        sku: selectedInventoryItem.sku,
        description: selectedInventoryItem.description || '',
        quantity: currentItem.quantity,
        unitPrice: currentItem.unitPrice,
        total: currentItem.quantity * currentItem.unitPrice
      }

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
    }

    // Reset current item
    setCurrentItem({
      selectedInventoryId: '',
      quantity: 1,
      unitPrice: 0
    })
    setError('')
  }

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
          : item
      )
    }))
  }

  const handleUnitPriceChange = (itemId: string, newUnitPrice: number) => {
    if (newUnitPrice < 0) return
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, unitPrice: newUnitPrice, total: item.quantity * newUnitPrice }
          : item
      )
    }))
  }

  // Handle inventory item selection to auto-populate unit price
  const handleInventoryItemSelect = (inventoryId: string) => {
    const selectedItem = inventoryItems.find(item => item._id === inventoryId)
    if (selectedItem && selectedItem.pricing?.costPrice) {
      setCurrentItem(prev => ({
        ...prev,
        selectedInventoryId: inventoryId,
        unitPrice: selectedItem.pricing.costPrice
      }))
    } else {
      setCurrentItem(prev => ({
        ...prev,
        selectedInventoryId: inventoryId,
        unitPrice: 0
      }))
    }
  }

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    // Validation based on user role
    if (userRole === 'vendor' && !selectedSupplierId) {
      setError('Please select a supplier.')
      return
    }
    
    if (userRole === 'supplier' && !selectedVendorId) {
      setError('Please select a vendor.')
      return
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item to the order.')
      return
    }

    if (!formData.shippingAddress.street || !formData.shippingAddress.city) {
      setError('Shipping address is required.')
      return
    }

    setIsLoading(true)

    try {
      // Generate a unique order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Format shipping address as a single string
      const shippingAddress = `${formData.shippingAddress.street}, ${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.zipCode}, ${formData.shippingAddress.country}`
      
      // Transform data to match backend expectations (CreateOrderDto)
      const orderData = {
        orderId: orderId,
        supplierId: userRole === 'vendor' ? selectedSupplierId : undefined,
        vendorId: userRole === 'supplier' ? selectedVendorId : undefined,
        status: 'placed',
        priority: formData.priority,
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate).toISOString() : undefined,
        items: formData.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description
        })),
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0,
        currency: 'USD',
        shippingAddress: shippingAddress,
        notes: formData.notes,
        isUrgent: formData.priority === 'high'
      }

      console.log('Creating order with data:', orderData)

      const response = await apiService.request('orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      })

      console.log('Order creation response:', response)

      if (response.data) {
        setSuccess('Order created successfully!')
        
        // Reset form
        setFormData({
          shippingAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
          },
          items: [],
          notes: '',
          priority: 'medium',
          expectedDeliveryDate: ''
        })
        setSelectedSupplierId('')
        setCurrentItem({ selectedInventoryId: '', quantity: 1, unitPrice: 0 })
        setActiveTab('supplier')
        
        // Call success callback and close modal
        if (onSuccess) onSuccess()
        
        setTimeout(() => {
          onClose()
          setSuccess('')
        }, 1500)
      } else {
        console.error('Order creation failed:', response)
        setError(response.error || response.message || 'Failed to create order')
      }
    } catch (error: any) {
      console.error('Order creation error:', error)
      setError(error.message || 'Failed to create order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        items: [],
        notes: '',
        priority: 'medium',
        expectedDeliveryDate: ''
      })
      setCurrentItem({
        selectedInventoryId: '',
        quantity: 1,
        unitPrice: 0
      })
      setSelectedSupplierId('')
      setError('')
      setSuccess('')
      setActiveTab('customer')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create Purchase Order</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'supplier', name: userRole === 'vendor' ? 'Supplier' : 'Vendor', icon: '🏢' },
              { id: 'items', name: 'Order Items', icon: '📦' },
              { id: 'shipping', name: 'Shipping', icon: '🚚' },
              { id: 'review', name: 'Review', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>

          {/* Supplier/Vendor Tab */}
          {activeTab === 'supplier' && (
            <div className="space-y-4">
              {userRole === 'vendor' ? (
                <>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Supplier Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Supplier *
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a supplier...</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.supplierName} ({supplier.supplierCode}) - {supplier.email}
                        </option>
                      ))}
                    </select>
                    {loadingData && (
                      <p className="text-sm text-blue-600 mt-1">
                        Loading suppliers...
                      </p>
                    )}
                    {suppliers.length === 0 && !loadingData && (
                      <div className="text-sm mt-1">
                        <p className="text-orange-600">
                          No suppliers found. Make sure you have suppliers in your system.
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Debug: Response received - check browser console for details.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Vendor Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Vendor *
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a vendor...</option>
                      {vendors.map(vendor => {
                        const vendorName = vendor.name || vendor.vendorName || 'Unknown Vendor'
                        const vendorEmail = vendor.email || vendor.contacts?.[0]?.email || 'No email'
                        return (
                          <option key={vendor._id} value={vendor._id}>
                            {vendorName} - {vendorEmail}
                          </option>
                        )
                      })}
                    </select>
                    {loadingData && (
                      <p className="text-sm text-blue-600 mt-1">
                        Loading vendors...
                      </p>
                    )}
                    {vendors.length === 0 && !loadingData && (
                      <div className="text-sm mt-1">
                        <p className="text-orange-600">
                          No vendors found. Make sure you have vendors in your system.
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Debug: Response received - check browser console for details.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Order Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Order Items</h4>
              
              {/* Add Item Form */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Add Item</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Item *
                    </label>
                    <select
                      value={currentItem.selectedInventoryId}
                      onChange={(e) => handleInventoryItemSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select an item...</option>
                      {inventoryItems.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.sku})
                        </option>
                      ))}
                    </select>
                    {currentItem.selectedInventoryId && (
                      <div className="mt-2 text-sm text-gray-600">
                        {(() => {
                          const selectedItem = inventoryItems.find(item => item._id === currentItem.selectedInventoryId)
                          return selectedItem ? (
                            <div>
                              <p><strong>SKU:</strong> {selectedItem.sku}</p>
                              <p><strong>Available Stock:</strong> {selectedItem.inventory?.currentStock || 0}</p>
                              {selectedItem.description && <p><strong>Description:</strong> {selectedItem.description}</p>}
                              <p><strong>Unit Price:</strong> ${(selectedItem.pricing?.costPrice || 0).toFixed(2)}</p>
                            </div>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unitPrice}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Order Items</h5>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-4 text-sm text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{item.sku}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleUnitPriceChange(item.id, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">${item.total.toFixed(2)}</td>
                            <td className="px-4 py-4 text-sm">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-right">
                    <p className="text-lg font-medium text-gray-900">
                      Total: ${getTotalAmount().toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Shipping Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.zipCode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, zipCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.country}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, country: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes or special instructions..."
                />
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Review Purchase Order</h4>

              {/* Supplier Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Supplier</h5>
                {selectedSupplierId ? (
                  <p className="text-gray-700">
                    {(() => {
                      const supplier = suppliers.find(s => s._id === selectedSupplierId)
                      return supplier ? `${supplier.supplierName} (${supplier.supplierCode}) - ${supplier.email}` : 'Supplier not found'
                    })()}
                  </p>
                ) : (
                  <p className="text-red-600">No supplier selected</p>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Order Items</h5>
                {formData.items.length > 0 ? (
                  <div className="space-y-2">
                    {formData.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-gray-700">{item.itemName} ({item.sku})</span>
                        <span className="text-gray-700">{item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 font-medium">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600">No items added</p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Shipping Address</h5>
                <p className="text-gray-700">
                  {formData.shippingAddress.street && formData.shippingAddress.city ? (
                    `${formData.shippingAddress.street}, ${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.zipCode}, ${formData.shippingAddress.country}`
                  ) : (
                    <span className="text-red-600">Incomplete shipping address</span>
                  )}
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Additional Information</h5>
                <div className="space-y-1 text-gray-700">
                  <p><strong>Priority:</strong> {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}</p>
                  {formData.expectedDeliveryDate && (
                    <p><strong>Expected Delivery:</strong> {new Date(formData.expectedDeliveryDate).toLocaleDateString()}</p>
                  )}
                  {formData.notes && (
                    <p><strong>Notes:</strong> {formData.notes}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const tabs = ['supplier', 'items', 'shipping', 'review']
                const currentIndex = tabs.indexOf(activeTab)
                if (currentIndex > 0) {
                  handleTabChange(tabs[currentIndex - 1])
                }
              }}
              disabled={activeTab === 'supplier'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>

              {activeTab === 'review' ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Order'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['supplier', 'items', 'shipping', 'review']
                    const currentIndex = tabs.indexOf(activeTab)
                    if (currentIndex < tabs.length - 1) {
                      handleTabChange(tabs[currentIndex + 1])
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 