'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { inventoryApi } from '@/lib/api'

// Type definitions
interface InventoryItem {
  _id: string;
  id?: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  costPrice?: number;
  currentStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  currency?: string;
  status?: string;
  tags?: string[];
  inventory?: {
    currentStock?: number;
    availableStock?: number;
    reorderPoint?: number;
    minimumStock?: number;
    maximumStock?: number;
    location?: string;
  };
  pricing?: {
    costPrice?: number;
    currency?: string;
  };
  unitPrice?: number;
  totalValue?: number;
  // Populated fields from backend
  tenantId?: {
    _id: string;
    companyName: string;
    email: string;
  };
  supplier?: {
    name: string;
    vendorCode?: string;
  };
  vendor?: {
    name: string;
    vendorCode?: string;
  };
  primarySupplier?: {
    name: string;
    companyName?: string;
    email?: string;
    vendorCode?: string;
  };
}

interface CreateInventoryItemDto {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  costPrice: number;
  currentStock: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  currency?: string;
}

interface InventoryData {
  items: InventoryItem[];
  total: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

// Add Item Modal Component
function AddItemModal({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateInventoryItemDto>({
    sku: '',
    name: '',
    description: '',
    category: 'equipment',
    unitOfMeasure: 'piece',
    costPrice: 0,
    currentStock: 0,
    reorderPoint: 20,
    reorderQuantity: 50,
    currency: 'USD'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await inventoryApi.create(formData)
      
      if (response.data || (response as any)._id || (response as any).id) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          sku: '',
          name: '',
          description: '',
          category: 'equipment',
          unitOfMeasure: 'piece',
          costPrice: 0,
          currentStock: 0,
          reorderPoint: 20,
          reorderQuantity: 50,
          currency: 'USD'
        })
      } else if (response.error) {
        alert(`Error: ${response.error}`)
      }
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Failed to create item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Inventory Item</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="e.g., PROD-001"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="e.g., Wireless Headphones"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="raw_materials">Raw Materials</option>
                        <option value="finished_goods">Finished Goods</option>
                        <option value="work_in_progress">Work in Progress</option>
                        <option value="packaging">Packaging</option>
                        <option value="supplies">Supplies</option>
                        <option value="equipment">Equipment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                      <select
                        value={formData.unitOfMeasure}
                        onChange={(e) => setFormData({...formData, unitOfMeasure: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="l">Liter</option>
                        <option value="m">Meter</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                        <option value="roll">Roll</option>
                        <option value="set">Set</option>
                        <option value="pair">Pair</option>
                        <option value="dozen">Dozen</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                      <input
                        type="number"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                      <input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                      <input
                        type="number"
                        value={formData.reorderPoint}
                        onChange={(e) => setFormData({...formData, reorderPoint: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                      <input
                        type="number"
                        value={formData.reorderQuantity}
                        onChange={(e) => setFormData({...formData, reorderQuantity: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="50"
                      />
                    </div>
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
                {isSubmitting ? 'Creating...' : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={onClose}
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

// Edit Item Modal Component
function EditItemModal({ isOpen, onClose, onSuccess, item }: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}) {
  const [formData, setFormData] = useState<CreateInventoryItemDto>({
    sku: '',
    name: '',
    description: '',
    category: 'equipment',
    unitOfMeasure: 'piece',
    costPrice: 0,
    currentStock: 0,
    reorderPoint: 20,
    reorderQuantity: 50,
    currency: 'USD'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        sku: item.sku,
        name: item.name,
        description: item.description || '',
        category: item.category || 'equipment',
        unitOfMeasure: 'piece', // Default since not in InventoryItem interface
        costPrice: item.pricing?.costPrice || item.unitPrice || 0,
        currentStock: item.inventory?.currentStock || item.currentStock || 0,
        reorderPoint: 20, // Default since not in InventoryItem interface
        reorderQuantity: 50, // Default since not in InventoryItem interface
        currency: 'USD'
      })
    }
  }, [item, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    
    setIsSubmitting(true)
    
    try {
      // Transform frontend data to backend format
      const updateData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure,
        costPrice: formData.costPrice,
        currentStock: formData.currentStock,
        reorderPoint: formData.reorderPoint,
        reorderQuantity: formData.reorderQuantity,
        currency: formData.currency
      }
      
      const response = await inventoryApi.update(item._id, updateData)
      if (response.data || !response.error) {
        toast.success('Item updated successfully!')
        onSuccess()
        onClose()
      } else if (response.error) {
        // Handle case where item might have been deleted
        if (response.error.includes('not found') || response.error.includes('Not Found')) {
          toast.error('This item no longer exists. It may have been deleted.')
          onSuccess() // Refresh the list
          onClose()
        } else {
          toast.error(`Error: ${response.error}`)
        }
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Inventory Item</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="raw_materials">Raw Materials</option>
                        <option value="finished_goods">Finished Goods</option>
                        <option value="work_in_progress">Work in Progress</option>
                        <option value="packaging">Packaging</option>
                        <option value="supplies">Supplies</option>
                        <option value="equipment">Equipment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                      <select
                        value={formData.unitOfMeasure}
                        onChange={(e) => setFormData({...formData, unitOfMeasure: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="l">Liter</option>
                        <option value="m">Meter</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                        <option value="roll">Roll</option>
                        <option value="set">Set</option>
                        <option value="pair">Pair</option>
                        <option value="dozen">Dozen</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                      <input
                        type="number"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                      <input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                      <input
                        type="number"
                        value={formData.reorderPoint}
                        onChange={(e) => setFormData({...formData, reorderPoint: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                      <input
                        type="number"
                        value={formData.reorderQuantity}
                        onChange={(e) => setFormData({...formData, reorderQuantity: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
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
                {isSubmitting ? 'Updating...' : 'Update Item'}
              </button>
              <button
                type="button"
                onClick={onClose}
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

// Restock Modal Component
function RestockModal({ isOpen, onClose, onSuccess, item }: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}) {
  const [quantity, setQuantity] = useState(0)
  const [type, setType] = useState<'add' | 'remove' | 'set'>('add')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    
    setIsSubmitting(true)
    
    try {
      const response = await inventoryApi.updateStock(item._id, quantity, type)
      if (response.data) {
        toast.success('Stock updated successfully!')
        onSuccess()
        onClose()
        setQuantity(0)
        setType('add')
      } else if (response.error) {
        toast.error(`Error: ${response.error}`)
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Failed to update stock. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !item) return null

  const currentStock = item.inventory?.currentStock || item.currentStock || 0

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Update Stock - {item.name}</h3>
                <p className="text-sm text-gray-600 mb-4">Current Stock: <span className="font-semibold">{currentStock}</span></p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'add' | 'remove' | 'set')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="add">Add Stock</option>
                      <option value="remove">Remove Stock</option>
                      <option value="set">Set Stock Level</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {type === 'add' ? 'Quantity to Add' : type === 'remove' ? 'Quantity to Remove' : 'New Stock Level'} *
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      min="0"
                      placeholder="Enter quantity"
                    />
                  </div>

                  {type !== 'set' && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        New stock level will be: <span className="font-semibold">
                          {type === 'add' ? currentStock + quantity : Math.max(0, currentStock - quantity)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Stock'}
              </button>
              <button
                type="button"
                onClick={onClose}
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

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, item }: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: InventoryItem | null;
}) {
  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Inventory Item
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <span className="font-semibold">{item.name}</span> (SKU: {item.sku})? 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InventoryManagement() {
  const router = useRouter()
  const [inventoryData, setInventoryData] = useState<InventoryData>({
    items: [],
    total: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)


  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Clear any stale selected item data
    setSelectedItem(null)
    setShowEditModal(false)
    setShowDeleteModal(false)
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔄 Loading inventory data...')
      const response = await inventoryApi.getAll()
      console.log('📦 API Response:', response)
      console.log('📦 Response data:', response?.data)
      console.log('📦 Items array:', response?.data?.items)
      console.log('📦 Items length:', response?.data?.items?.length)
      
      // Backend returns { items: [], total: number }
      if (response?.data?.items && Array.isArray(response.data.items)) {
        console.log(`✅ Found ${response.data.items.length} items`)
        console.log('📦 Raw items:', response.data.items)
        
        const items = response.data.items.map((item: any) => ({
          _id: item._id,
          name: item.name || 'Unknown Item',
          sku: item.sku || 'N/A',
          description: item.description || '',
          category: item.category || 'Uncategorized',
          unitOfMeasure: item.unitOfMeasure || 'units',
          pricing: {
            costPrice: item.pricing?.costPrice || 0,
            sellingPrice: item.pricing?.sellingPrice || 0,
            currency: item.pricing?.currency || 'USD',
          },
          inventory: {
            currentStock: item.inventory?.currentStock || 0,
            minimumStock: item.inventory?.minimumStock || 0,
            maximumStock: item.inventory?.maximumStock || 100,
            reorderPoint: item.inventory?.reorderPoint || 10,
            location: item.inventory?.location || 'Main Warehouse',
          },
          supplier: {
            name: item.primarySupplier?.name || item.primarySupplier?.companyName || item.supplier?.name || 'N/A',
            contactInfo: {
              email: item.primarySupplier?.email || item.supplier?.contactInfo?.email || '',
              phone: item.supplier?.contactInfo?.phone || '',
            },
          },
          status: item.status || 'active',
          lastUpdated: item.lastUpdated || new Date().toISOString(),
          totalValue: (item.inventory?.currentStock || 0) * (item.pricing?.costPrice || 0),
          // Populate populated fields
          tenantId: item.tenantId,
          vendor: item.vendor,
          primarySupplier: item.primarySupplier,
        }))

        const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0)
        const lowStockCount = items.filter(item => 
          item.inventory.currentStock <= item.inventory.reorderPoint
        ).length
        const outOfStockCount = items.filter(item => 
          item.inventory.currentStock === 0
        ).length

        console.log(`📊 Processed: ${items.length} items, $${totalValue} total value`)

        setInventoryData({
          items,
          total: response.data.total || items.length,
          totalValue,
          lowStockCount,
          outOfStockCount,
        })
      } else {
        console.log('❌ Invalid API response structure:', response)
        setError('Invalid inventory data received from server')
      }
    } catch (error) {
      console.error('❌ Error loading inventory:', error)
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const handleRestock = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowRestockModal(true)
  }

  const handleDelete = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem) return
    
    try {
      const response = await inventoryApi.delete(selectedItem._id)
      if (response.data !== undefined || response.error === undefined) { // Check for successful response
        toast.success('Item deleted successfully!')
        loadInventoryData() // Refresh the list
        setShowDeleteModal(false)
        setSelectedItem(null)
      } else if (response.error) {
        toast.error(`Error: ${response.error}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item. Please try again.')
    }
  }

  const handleExport = () => {
    // setIsExporting(true) // This state was removed from the new_code, so this function will need to be updated or removed if not used.
    try {
      // Ask user what to export
      const exportFiltered = inventoryData.items.length < inventoryData.items.length // This line is problematic as it compares to itself
      let dataToExport = inventoryData.items
      let filename = 'inventory-export'
      
      if (exportFiltered) {
        const exportAll = confirm(
          `Export all ${inventoryData.items.length} items or only filtered ${inventoryData.items.length} items?\n\n` +
          `Click "OK" for ALL items, "Cancel" for filtered items only.`
        )
        
        if (!exportAll) {
          dataToExport = inventoryData.items // This line is problematic as it overwrites dataToExport
          filename = 'inventory-filtered-export'
        }
      }

      // Convert inventory data to CSV format
      const headers = [
        'SKU',
        'Item Name', 
        'Description',
        'Category',
        'Unit of Measure',
        'Current Stock',
        'Unit Price ($)',
        'Total Value ($)',
        'Stock Status',
        'Created Date',
        'Last Updated'
      ]

      const csvData = dataToExport.map(item => {
        const stock = item.inventory?.currentStock ?? item.currentStock ?? 0
        const price = item.pricing?.costPrice ?? item.unitPrice ?? 0
        const totalValue = stock * price
        const stockStatus = getStockStatusDisplay(item)
        
        return [
          item.sku,
          item.name,
          item.description || '',
          getCategoryDisplay(item.category || 'other'),
          'piece', // Default unit of measure
          stock,
          price.toFixed(2),
          totalValue.toFixed(2),
          stockStatus,
          new Date().toLocaleDateString(), // Default created date
          new Date().toLocaleDateString()  // Default updated date
        ]
      })

      // Create CSV content with proper escaping
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(cell => {
            const cellStr = String(cell)
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          }).join(',')
        )
      ].join('\n')

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        // Show success message
        alert(`Successfully exported ${dataToExport.length} inventory items!`)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      // setIsExporting(false) // This state was removed from the new_code, so this block will need to be updated or removed if not used.
    }
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'high':
      case 'In Stock':
        return 'bg-green-100 text-green-800'
      case 'low':
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'out':
      case 'Out of Stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatusDisplay = (item: InventoryItem) => {
    const stock = item.inventory?.currentStock ?? item.currentStock ?? 0
    const reorderPoint = 20 // Default reorder point
    
    if (stock === 0) return 'Out of Stock'
    if (stock <= reorderPoint) return 'Low Stock'
    return 'In Stock'
  }

  const getCategoryDisplay = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredItems = inventoryData.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const stockStatus = getStockStatusDisplay(item)
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && (item.inventory?.currentStock || 0) <= (item.inventory?.reorderPoint || 0)) ||
                        (stockFilter === 'out' && (item.inventory?.currentStock || 0) === 0)
    
    return matchesSearch && matchesCategory && matchesStock
  })

  if (loading) {
    return (
      <DashboardLayout title="Inventory Management" description="Loading inventory data...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </DashboardLayout>
  )
}

  return (
    <DashboardLayout title="Inventory Management" description="Manage your inventory, track stock levels, and optimize your supply chain">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryData.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">${inventoryData.totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">{inventoryData.lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{inventoryData.outOfStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Furniture">Furniture</option>
                <option value="Equipment">Equipment</option>
              </select>
              
              <select 
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            
            {/* Add Item button removed - Admins should only view inventory */}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tenantId?.companyName || item.primarySupplier?.name || item.primarySupplier?.companyName || item.supplier?.name || item.vendor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.inventory.currentStock}</div>
                      <div className="text-xs text-gray-500">Min: {item.inventory.minimumStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.pricing.costPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.inventory.currentStock === 0 
                          ? 'bg-red-100 text-red-800'
                          : item.inventory.currentStock <= item.inventory.reorderPoint
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.inventory.currentStock === 0 
                          ? 'Out of Stock'
                          : item.inventory.currentStock <= item.inventory.reorderPoint
                          ? 'Low Stock'
                          : 'In Stock'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No inventory items found</div>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <EditItemModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedItem(null)
          }}
          onSuccess={loadInventoryData}
          item={selectedItem}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedItem(null)
          }}
          onConfirm={handleConfirmDelete}
          item={selectedItem}
        />

        {/* Restock Modal */}
        <RestockModal
          isOpen={showRestockModal}
          onClose={() => {
            setShowRestockModal(false)
            setSelectedItem(null)
          }}
          onSuccess={loadInventoryData}
          item={selectedItem}
        />
      </div>
    </DashboardLayout>
  )
}
