'use client'

import { useState, useEffect } from 'react'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { inventoryApi } from '@/lib/api'

interface InventoryItem {
  _id: string;
  id?: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure?: string;
  costPrice?: number;
  currentStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  currency?: string;
  status?: string;
  inventory?: {
    currentStock?: number;
    availableStock?: number;
    reorderPoint?: number;
  };
  pricing?: {
    costPrice?: number;
    sellingPrice?: number;
    currency?: string;
  };
  unitPrice?: number;
  quantity?: number;
  price?: number;
}

export default function VendorInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await inventoryApi.getAll()
      
      if (response?.data) {
        if (Array.isArray(response.data)) {
          setInventory(response.data)
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          setInventory(response.data.items)
        } else {
          setInventory([])
        }
      } else {
        setInventory([])
      }
    } catch (err) {
      console.error('Error loading inventory:', err)
      setError('Failed to load inventory data')
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const getItemStatus = (item: InventoryItem) => {
    const stock = item.inventory?.currentStock || item.currentStock || item.quantity || 0
    const reorderPoint = item.inventory?.reorderPoint || item.reorderPoint || 10
    
    if (stock === 0) return 'out_of_stock'
    if (stock <= reorderPoint) return 'low_stock'
    return 'in_stock'
  }

  const getItemPrice = (item: InventoryItem) => {
    return item.pricing?.sellingPrice || item.pricing?.costPrice || item.costPrice || item.price || 0
  }

  const getItemStock = (item: InventoryItem) => {
    return item.inventory?.currentStock || item.currentStock || item.quantity || 0
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const itemStatus = getItemStatus(item)
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800'
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock'
      case 'low_stock':
        return 'Low Stock'
      case 'out_of_stock':
        return 'Out of Stock'
      default:
        return status
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    if (confirm(`Are you sure you want to remove ${item.name} from inventory?`)) {
      try {
        await inventoryApi.delete(item._id)
        loadInventory()
        alert('Item removed successfully!')
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Failed to delete item. Please try again.')
      }
    }
  }

  // Simple Add Product Modal
  const AddProductModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      sku: '',
      category: '',
      description: '',
      costPrice: 0,
      currentStock: 0,
      reorderPoint: 10,
      unitOfMeasure: 'piece'
    })

    const categories = [
      { value: 'raw_materials', label: 'Raw Materials' },
      { value: 'finished_goods', label: 'Finished Goods' },
      { value: 'work_in_progress', label: 'Work in Progress' },
      { value: 'packaging', label: 'Packaging' },
      { value: 'supplies', label: 'Supplies' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'other', label: 'Other' }
    ]

    const unitOfMeasureOptions = [
      { value: 'piece', label: 'Piece' },
      { value: 'kg', label: 'Kilogram (kg)' },
      { value: 'l', label: 'Liter (l)' },
      { value: 'm', label: 'Meter (m)' },
      { value: 'box', label: 'Box' },
      { value: 'pack', label: 'Pack' },
      { value: 'roll', label: 'Roll' },
      { value: 'set', label: 'Set' },
      { value: 'pair', label: 'Pair' },
      { value: 'dozen', label: 'Dozen' },
      { value: 'hundred', label: 'Hundred' },
      { value: 'thousand', label: 'Thousand' }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        console.log('Submitting form data:', formData)
        const response = await inventoryApi.create(formData)
        console.log('Create response:', response)
        setShowAddModal(false)
        loadInventory()
        alert('Product added successfully!')
        setFormData({
          name: '',
          sku: '',
          category: '',
          description: '',
          costPrice: 0,
          currentStock: 0,
          reorderPoint: 10,
          unitOfMeasure: 'piece'
        })
      } catch (error) {
        console.error('Error adding product:', error)
        console.error('Error details:', error.response?.data || error.message)
        alert(`Failed to add product: ${error.response?.data?.message || error.message}`)
      }
    }

    if (!showAddModal) return null

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form onSubmit={handleSubmit}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Product</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional product description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit of Measure *</label>
                    <select
                      required
                      value={formData.unitOfMeasure}
                      onChange={(e) => setFormData({...formData, unitOfMeasure: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {unitOfMeasureOptions.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

  // Edit Product Modal
  const EditModal = () => {
    const [editFormData, setEditFormData] = useState({
      name: '',
      sku: '',
      category: '',
      description: '',
      costPrice: 0,
      currentStock: 0,
      reorderPoint: 10,
      unitOfMeasure: 'piece'
    })

    const categories = [
      { value: 'raw_materials', label: 'Raw Materials' },
      { value: 'finished_goods', label: 'Finished Goods' },
      { value: 'work_in_progress', label: 'Work in Progress' },
      { value: 'packaging', label: 'Packaging' },
      { value: 'supplies', label: 'Supplies' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'other', label: 'Other' }
    ]

    const unitOfMeasureOptions = [
      { value: 'piece', label: 'Piece' },
      { value: 'kg', label: 'Kilogram (kg)' },
      { value: 'l', label: 'Liter (l)' },
      { value: 'm', label: 'Meter (m)' },
      { value: 'box', label: 'Box' },
      { value: 'pack', label: 'Pack' },
      { value: 'roll', label: 'Roll' },
      { value: 'set', label: 'Set' },
      { value: 'pair', label: 'Pair' },
      { value: 'dozen', label: 'Dozen' },
      { value: 'hundred', label: 'Hundred' },
      { value: 'thousand', label: 'Thousand' }
    ]

    // Pre-populate form when modal opens
    useEffect(() => {
      if (selectedItem) {
        setEditFormData({
          name: selectedItem.name || '',
          sku: selectedItem.sku || '',
          category: selectedItem.category || '',
          description: selectedItem.description || '',
          costPrice: selectedItem.pricing?.costPrice || selectedItem.costPrice || selectedItem.price || 0,
          currentStock: selectedItem.inventory?.currentStock || selectedItem.currentStock || selectedItem.quantity || 0,
          reorderPoint: selectedItem.inventory?.reorderPoint || selectedItem.reorderPoint || 10,
          unitOfMeasure: selectedItem.unitOfMeasure || 'piece'
        })
      }
    }, [selectedItem])

    const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedItem) return
      
      try {
        console.log('Updating item:', selectedItem._id, 'with data:', editFormData)
        const response = await inventoryApi.update(selectedItem._id, editFormData)
        console.log('Update response:', response)
        setShowEditModal(false)
        loadInventory()
        alert('Product updated successfully!')
      } catch (error) {
        console.error('Error updating product:', error)
        console.error('Error details:', error.response?.data || error.message)
        alert(`Failed to update product: ${error.response?.data?.message || error.message}`)
      }
    }

    if (!showEditModal || !selectedItem) return null

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form onSubmit={handleEditSubmit}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Product: {selectedItem.name}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.sku}
                      onChange={(e) => setEditFormData({...editFormData, sku: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      required
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional product description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.costPrice}
                      onChange={(e) => setEditFormData({...editFormData, costPrice: parseFloat(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.currentStock}
                      onChange={(e) => setEditFormData({...editFormData, currentStock: parseInt(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.reorderPoint}
                      onChange={(e) => setEditFormData({...editFormData, reorderPoint: parseInt(e.target.value) || 0})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit of Measure *</label>
                    <select
                      required
                      value={editFormData.unitOfMeasure}
                      onChange={(e) => setEditFormData({...editFormData, unitOfMeasure: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {unitOfMeasureOptions.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

  // Simple Restock Modal
  const RestockModal = () => {
    const [quantity, setQuantity] = useState(0)
    
    const handleRestock = async () => {
      if (!selectedItem) return
      try {
        await inventoryApi.updateStock(selectedItem._id, quantity, 'add')
        setShowRestockModal(false)
        loadInventory()
        alert('Stock updated successfully!')
        setQuantity(0)
      } catch (error) {
        console.error('Error updating stock:', error)
        alert('Failed to update stock. Please try again.')
      }
    }

    if (!showRestockModal || !selectedItem) return null
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRestockModal(false)}></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Restock {selectedItem.name}</h3>
            <p className="text-gray-600 mb-4">Current Stock: {selectedItem.inventory?.currentStock || selectedItem.currentStock || selectedItem.quantity || 0}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Quantity to Add</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRestock}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Update Stock
              </button>
              <button
                onClick={() => setShowRestockModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <VendorRoute>
      <DashboardLayout title="Inventory" description="Track and manage your product inventory levels">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mt-4 sm:mt-0">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                      <dd className="text-lg font-medium text-gray-900">{inventory.length}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">In Stock</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {inventory.filter(item => getItemStatus(item) === 'in_stock').length}
                      </dd>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.118 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {inventory.filter(item => getItemStatus(item) === 'low_stock').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {inventory.filter(item => getItemStatus(item) === 'out_of_stock').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search Products
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Stock Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Product Inventory</h3>
                <p className="mt-1 text-sm text-gray-500 sm:mt-0">
                  {filteredInventory.length} of {inventory.length} products
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.inventory?.currentStock || item.currentStock || item.quantity || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${(item.pricing?.costPrice || item.costPrice || item.price || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getItemStatus(item))}`}>
                            {getStatusText(getItemStatus(item))}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => {
                              setSelectedItem(item)
                              setShowEditModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedItem(item)
                              setShowRestockModal(true)
                            }}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Restock
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
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

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first product to inventory.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddProductModal />
        <EditModal />
        <RestockModal />
      </DashboardLayout>
    </VendorRoute>
  )
}
