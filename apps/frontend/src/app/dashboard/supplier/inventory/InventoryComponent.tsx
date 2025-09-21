'use client';

import { useState, useEffect } from 'react';
import { SupplierDashboardLayout } from '@/components/ui/ProtectedDashboardLayout'
import { Pagination } from '@/components/ui/Pagination'
import { inventoryApi } from '@/lib/api'

interface CreateInventoryItemDto {
  sku: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  costPrice: number;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  currency: string;
}

interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure?: string;
  pricing: {
    costPrice: number;
    currency?: string;
  };
  inventory: {
    currentStock: number;
    availableStock: number;
    reorderPoint?: number;
    reorderQuantity?: number;
  };
  status?: string;
  brand?: string;
  manufacturer?: string;
  createdAt: string;
  updatedAt: string;
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
                      placeholder="Item description..."
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
                        <option value="equipment">Equipment</option>
                        <option value="supplies">Supplies</option>
                        <option value="materials">Materials</option>
                        <option value="tools">Tools</option>
                        <option value="parts">Parts</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                      <select
                        value={formData.unitOfMeasure}
                        onChange={(e) => setFormData({...formData, unitOfMeasure: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="piece">Piece</option>
                        <option value="box">Box</option>
                        <option value="kg">Kilogram</option>
                        <option value="liter">Liter</option>
                        <option value="meter">Meter</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reorderPoint}
                        onChange={(e) => setFormData({...formData, reorderPoint: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reorderQuantity}
                        onChange={(e) => setFormData({...formData, reorderQuantity: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function InventoryComponent() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Initial load
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const response = await inventoryApi.getAll(params);
      
      if (response?.data) {
        // Handle different response formats
        let items: InventoryItem[] = [];
        let total = 0;
        
        const responseData = response.data as any;
        
        if (Array.isArray(responseData)) {
          items = responseData;
          total = responseData.length;
        } else if (responseData.items) {
          items = responseData.items;
          total = responseData.total || responseData.totalCount || 0;
        } else if (responseData.data) {
          items = responseData.data;
          total = responseData.total || responseData.totalCount || 0;
        }
        
        setInventory(items);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        setInventory([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError('Failed to load inventory items');
      setInventory([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadInventory();
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    loadInventory();
  };

  const handleItemCreated = () => {
    // Refresh inventory after creating new item
    setCurrentPage(1);
    loadInventory();
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleRestock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowRestockModal(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await inventoryApi.delete(item._id);
        loadInventory(); // Reload the list
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedItem(null);
    loadInventory();
  };

  const handleRestockSuccess = () => {
    setShowRestockModal(false);
    setSelectedItem(null);
    loadInventory();
  };

  return (
    <SupplierDashboardLayout title="Inventory" description="Manage your inventory items">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Item
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading inventory...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {item.category?.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.inventory?.currentStock || 0}
                            {item.unitOfMeasure && ` ${item.unitOfMeasure}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${(item.pricing?.costPrice || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                            title="Edit item"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleRestock(item)}
                            className="text-green-600 hover:text-green-900 mr-3 transition-colors"
                            title="Restock item"
                          >
                            Restock
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete item"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inventory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <p className="mt-2 text-sm">No inventory items found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalItems > 0 && (
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
            </>
          )}
        </div>

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleItemCreated}
        />

        {/* Edit Item Modal */}
        {selectedItem && (
          <EditItemModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
            item={selectedItem}
          />
        )}

        {/* Restock Item Modal */}
        {selectedItem && (
          <RestockItemModal
            isOpen={showRestockModal}
            onClose={() => setShowRestockModal(false)}
            onSuccess={handleRestockSuccess}
            item={selectedItem}
          />
        )}
      </div>
    </SupplierDashboardLayout>
  );
}

// Edit Item Modal Component
function EditItemModal({ isOpen, onClose, onSuccess, item }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
}) {
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || '',
    sku: item.sku,
    category: item.category,
    unitOfMeasure: item.unitOfMeasure || '',
    costPrice: item.pricing.costPrice,
    reorderPoint: item.inventory.reorderPoint || 0,
    reorderQuantity: item.inventory.reorderQuantity || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await inventoryApi.update(item._id, {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure,
        // Flattened pricing fields (as expected by backend)
        costPrice: formData.costPrice,
        currency: 'USD',
        // Flattened inventory fields (as expected by backend)
        reorderPoint: formData.reorderPoint,
        reorderQuantity: formData.reorderQuantity
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Item</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="raw_materials">Raw Materials</option>
                <option value="finished_goods">Finished Goods</option>
                <option value="work_in_progress">Work In Progress</option>
                <option value="packaging">Packaging</option>
                <option value="supplies">Supplies</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit of Measure *</label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                <option value="hundred">Hundred</option>
                <option value="thousand">Thousand</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reorder Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Restock Item Modal Component
function RestockItemModal({ isOpen, onClose, onSuccess, item }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
}) {
  const [quantity, setQuantity] = useState(item.inventory.reorderQuantity || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await inventoryApi.updateStock(item._id, quantity, 'add');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restock item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Restock Item</h3>
          
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm"><strong>Item:</strong> {item.name}</p>
            <p className="text-sm"><strong>Current Stock:</strong> {item.inventory.currentStock}</p>
            <p className="text-sm"><strong>SKU:</strong> {item.sku}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity to Add *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                New stock level will be: {item.inventory.currentStock + quantity}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Restocking...' : 'Restock Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
