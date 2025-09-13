'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

import { suppliersApi, type Supplier, type CreateSupplierDto, type SupplierSearchParams } from '@/lib/api'

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'suspended':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getCategoryDisplay = (category: string | undefined) => {
  if (!category) return 'Other'
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getStatusDisplay = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Add Supplier Modal Component
function AddSupplierModal({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateSupplierDto>({
    supplierName: '',
    supplierCode: '',
    category: 'food_supplies',
    description: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    paymentTerms: 'net_30',
    creditLimit: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validate required email field
      if (!formData.email || formData.email.trim() === '') {
        alert('Email is required');
        setIsSubmitting(false);
        return;
      }
      
      // Filter out empty or invalid contactEmail to avoid validation errors
      const submissionData = { ...formData }
      if (!submissionData.contactEmail || submissionData.contactEmail.trim() === '') {
        delete submissionData.contactEmail
      }
      
      // Also validate contactEmail format if provided
      if (submissionData.contactEmail && !submissionData.contactEmail.includes('@')) {
        delete submissionData.contactEmail
      }
      
      const response = await suppliersApi.create(submissionData)
      if (response.data) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          supplierName: '',
          supplierCode: '',
          category: 'food_supplies',
          description: '',
          website: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          paymentTerms: 'net_30',
          creditLimit: 0
        })
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('Failed to create supplier. Please try again.')
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Supplier</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Code</label>
                    <input
                      type="text"
                      value={formData.supplierCode}
                      onChange={(e) => setFormData({...formData, supplierCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="food_supplies">Food Supplies</option>
                      <option value="beverages">Beverages</option>
                      <option value="dairy">Dairy</option>
                      <option value="meat">Meat</option>
                      <option value="produce">Produce</option>
                      <option value="packaging">Packaging</option>
                      <option value="equipment">Equipment</option>
                      <option value="logistics">Logistics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional contact email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="net_30">Net 30</option>
                      <option value="net_60">Net 60</option>
                      <option value="net_90">Net 90</option>
                      <option value="immediate">Immediate</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
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
                {isSubmitting ? 'Creating...' : 'Create Supplier'}
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

// View Supplier Modal Component
function ViewSupplierModal({ isOpen, onClose, supplier }: { 
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}) {
  if (!isOpen || !supplier) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.supplierName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Code</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.supplierCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{getCategoryDisplay(supplier.category)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                    {getStatusDisplay(supplier.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.phone}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{`${supplier.address}, ${supplier.city}, ${supplier.state} ${supplier.zipCode}, ${supplier.country}`}</p>
                </div>
                {supplier.contactPerson && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="mt-1 text-sm text-gray-900">{supplier.contactPerson}</p>
                  </div>
                )}
                {supplier.paymentTerms && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <p className="mt-1 text-sm text-gray-900">{supplier.paymentTerms.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuppliersOverview() {
  const pathname = usePathname()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const isActiveLink = (path: string) => pathname === path

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: 1,
        limit: 50,
      }
      
      // Only add parameters if they have actual values
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await suppliersApi.getAll(params)
      
      // Handle different response structures
      const responseData = response as any;
      if (responseData.data && responseData.data.suppliers) {
        // Wrapped response: { data: { suppliers: [...], total: ... } }
        setSuppliers(responseData.data.suppliers || [])
        setTotal(responseData.data.total || 0)
      } else if (responseData.suppliers) {
        // Direct response: { suppliers: [...], total: ... }
        setSuppliers(responseData.suppliers || [])
        setTotal(responseData.total || 0)
      } else if (Array.isArray(responseData.data)) {
        // Array response: { data: [...] }
        setSuppliers(responseData.data || [])
        setTotal(responseData.data.length || 0)
      } else if (Array.isArray(responseData)) {
        // Direct array response: [...]
        setSuppliers(responseData || [])
        setTotal(responseData.length || 0)
      } else {
        console.warn('Unexpected suppliers response structure:', responseData)
        setSuppliers([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [searchQuery, categoryFilter, statusFilter])

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsViewModalOpen(true)
  }

  const handleDisableSupplier = async (supplier: Supplier) => {
    const action = supplier.status === 'active' ? 'disable' : 'enable'
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active'
    
    if (window.confirm(`Are you sure you want to ${action} ${supplier.supplierName}?`)) {
      try {
        const response = await suppliersApi.update(supplier._id, { status: newStatus } as any)
        if (response.data) {
          loadSuppliers()
          alert(`${supplier.supplierName} has been ${action}d successfully.`)
        }
      } catch (error) {
        console.error(`Error ${action}ing supplier:`, error)
        alert(`Failed to ${action} supplier. Please try again.`)
      }
    }
  }

  const handleExportSuppliers = () => {
    try {
      // Prepare CSV data
      const headers = ['Name', 'Code', 'Category', 'Email', 'Phone', 'Status', 'Address', 'Contact Person', 'Payment Terms', 'Credit Limit']
      
      const csvData = (suppliers || []).map(supplier => [
        supplier.supplierName || '',
        supplier.supplierCode || '',
        getCategoryDisplay(supplier.category),
        supplier.email || '',
        supplier.phone || '',
        getStatusDisplay(supplier.status),
        `${supplier.address}, ${supplier.city}, ${supplier.state} ${supplier.zipCode}, ${supplier.country}`,
        supplier.contactPerson || '',
        supplier.paymentTerms?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '',
        supplier.creditLimit?.toString() || '0'
      ])

      // Create CSV content
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting suppliers:', error)
      alert('Failed to export suppliers. Please try again.')
    }
  }

  return (
    <DashboardLayout title="Supplier Management" description="Manage and monitor your supplier relationships">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex-1">
            {/* Title is handled by DashboardLayout, no duplication needed */}
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Supplier</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search suppliers..."
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
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="food_supplies">Food Supplies</option>
                <option value="beverages">Beverages</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="produce">Produce</option>
                <option value="packaging">Packaging</option>
                <option value="equipment">Equipment</option>
                <option value="logistics">Logistics</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleExportSuppliers}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
            <p className="text-sm text-gray-600 mt-1">{total} total suppliers</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Payment Terms</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <span>Loading suppliers...</span>
                      </div>
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                        </svg>
                        <span>No suppliers found</span>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {supplier.supplierName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{supplier.supplierName}</div>
                            <div className="text-sm text-gray-500">{supplier.supplierCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        <span className="capitalize">{supplier.category.replace('_', ' ')}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {supplier.contactPerson || supplier.email}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        <span className="capitalize">{supplier.paymentTerms.replace('_', ' ')}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Supplier Modal */}
        <AddSupplierModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadSuppliers}
        />

        {/* View Supplier Modal */}
        <ViewSupplierModal 
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          supplier={selectedSupplier}
        />
      </div>
    </DashboardLayout>
  )
}
