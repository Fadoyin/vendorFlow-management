'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { AdminRoute } from '@/components/auth/RoleProtectedRoute'
import { vendorsApi, type Vendor, type CreateVendorDto, type VendorSearchParams } from '@/lib/api'

// Add Vendor Modal Component
function AddVendorModal({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateVendorDto>({
    name: '',
    vendorCode: '',
    category: 'raw_materials',
    description: '',
    website: '',
    address: {
      street: '123 Main St',
      city: '',
      state: 'CA',
      zipCode: '12345',
      country: '',
      additionalInfo: ''
    },
    contacts: [{
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      isPrimary: true
    }],
    paymentTerms: 'net_30',
    creditLimit: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await vendorsApi.create(formData)
      if (response.data) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          name: '',
          vendorCode: '',
          category: 'raw_materials',
          description: '',
          website: '',
          address: {
            street: '123 Main St',
            city: '',
            state: 'CA',
            zipCode: '12345',
            country: '',
            additionalInfo: ''
          },
          contacts: [{
            name: '',
            email: '',
            phone: '',
            jobTitle: '',
            isPrimary: true
          }],
          paymentTerms: 'net_30',
          creditLimit: 0
        })
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
      alert('Failed to create vendor. Please try again.')
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Vendor</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code</label>
                    <input
                      type="text"
                      required
                      value={formData.vendorCode}
                      onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="raw_materials">Raw Materials</option>
                      <option value="packaging">Packaging</option>
                      <option value="equipment">Equipment</option>
                      <option value="services">Services</option>
                      <option value="logistics">Logistics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      required
                      value={formData.contacts[0].name}
                      onChange={(e) => setFormData({
                        ...formData,
                        contacts: [{ ...formData.contacts[0], name: e.target.value }]
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={formData.contacts[0].email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contacts: [{ ...formData.contacts[0], email: e.target.value }]
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {isSubmitting ? 'Creating...' : 'Create Vendor'}
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

// View Vendor Modal Component
function ViewVendorModal({ isOpen, onClose, vendor }: { 
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
}) {
  if (!isOpen || !vendor) return null

  const primaryContact = vendor.contacts?.find(contact => contact.isPrimary) || vendor.contacts?.[0]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Vendor Name</label>
                      <p className="text-sm text-gray-900">{vendor.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Vendor Code</label>
                      <p className="text-sm text-gray-900">{vendor.vendorCode}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Category</label>
                      <p className="text-sm text-gray-900">{vendor.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                        vendor.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        vendor.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Primary Contact</label>
                      <p className="text-sm text-gray-900">{primaryContact?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{primaryContact?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{primaryContact?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Job Title</label>
                      <p className="text-sm text-gray-900">{primaryContact?.jobTitle || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Address</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Street</label>
                      <p className="text-sm text-gray-900">{vendor.address?.street || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">City</label>
                      <p className="text-sm text-gray-900">{vendor.address?.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">State</label>
                      <p className="text-sm text-gray-900">{vendor.address?.state || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Country</label>
                      <p className="text-sm text-gray-900">{vendor.address?.country || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Business Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Payment Terms</label>
                      <p className="text-sm text-gray-900">{vendor.paymentTerms?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Credit Limit</label>
                      <p className="text-sm text-gray-900">${vendor.creditLimit?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Total Orders</label>
                      <p className="text-sm text-gray-900">{vendor.performance?.totalOrders || 0}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Total Spend</label>
                      <p className="text-sm text-gray-900">${vendor.performance?.totalSpend?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
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

// Edit Vendor Modal Component
function EditVendorModal({ isOpen, onClose, vendor, onSuccess }: { 
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateVendorDto>({
    name: '',
    vendorCode: '',
    category: 'raw_materials',
    description: '',
    website: '',
    address: {
      street: '123 Main St',
      city: '',
      state: 'CA',
      zipCode: '12345',
      country: '',
      additionalInfo: ''
    },
    contacts: [{
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      isPrimary: true
    }],
    paymentTerms: 'net_30',
    creditLimit: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with vendor data when modal opens
  useEffect(() => {
    if (vendor && isOpen) {
      const primaryContact = vendor.contacts?.find(contact => contact.isPrimary) || vendor.contacts?.[0]
      setFormData({
        name: vendor.name,
        vendorCode: vendor.vendorCode,
        category: vendor.category || 'raw_materials',
        description: vendor.description || '',
        website: vendor.website || '',
        address: {
          street: vendor.address?.street || '123 Main St',
          city: vendor.address?.city || '',
          state: vendor.address?.state || 'CA',
          zipCode: vendor.address?.zipCode || '12345',
          country: vendor.address?.country || '',
          additionalInfo: ''
        },
        contacts: primaryContact ? [{
          name: primaryContact.name,
          email: primaryContact.email,
          phone: primaryContact.phone || '',
          jobTitle: primaryContact.jobTitle || '',
          isPrimary: true
        }] : [{
          name: '',
          email: '',
          phone: '',
          jobTitle: '',
          isPrimary: true
        }],
        paymentTerms: vendor.paymentTerms || 'net_30',
        creditLimit: vendor.creditLimit || 0
      })
    }
  }, [vendor, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor) return
    
    setIsSubmitting(true)
    
    try {
      const response = await vendorsApi.update(vendor._id, formData as any)
      if (response.data) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error updating vendor:', error)
      alert('Failed to update vendor. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !vendor) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Vendor</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code</label>
                    <input
                      type="text"
                      required
                      value={formData.vendorCode}
                      onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="raw_materials">Raw Materials</option>
                      <option value="packaging">Packaging</option>
                      <option value="equipment">Equipment</option>
                      <option value="services">Services</option>
                      <option value="logistics">Logistics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      required
                      value={formData.contacts[0].name}
                      onChange={(e) => setFormData({
                        ...formData,
                        contacts: [{ ...formData.contacts[0], name: e.target.value }]
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={formData.contacts[0].email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contacts: [{ ...formData.contacts[0], email: e.target.value }]
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {isSubmitting ? 'Updating...' : 'Update Vendor'}
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

export default function VendorManagement() {
  const pathname = usePathname()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  const isActiveLink = (path: string) => pathname === path

  const loadVendors = async () => {
    try {
      setLoading(true)
      const params: VendorSearchParams = {
        page: 1,
        limit: 50,
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await vendorsApi.getAll(params)
      if (response.data) {
        setVendors(response.data.vendors)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('Error loading vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [searchQuery, categoryFilter, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      case 'blacklisted':
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

  const getPrimaryContact = (vendor: Vendor) => {
    // First try to get from contacts array
    if (vendor.contacts && vendor.contacts.length > 0) {
      return vendor.contacts.find(contact => contact.isPrimary) || vendor.contacts[0]
    }
    // Fallback to vendor's direct email and companyName
    if (vendor.email) {
      return {
        name: vendor.companyName || vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        jobTitle: '',
        isPrimary: true
      }
    }
    return null
  }

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsEditModalOpen(true)
  }

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsViewModalOpen(true)
  }

  const handleDisableVendor = async (vendor: Vendor) => {
    const action = vendor.status === 'active' ? 'disable' : 'enable'
    const newStatus = vendor.status === 'active' ? 'inactive' : 'active'
    
    if (window.confirm(`Are you sure you want to ${action} ${vendor.name}?`)) {
      try {
        const response = await vendorsApi.update(vendor._id, { status: newStatus } as any)
        if (response.data) {
          // Refresh the vendors list
          loadVendors()
          alert(`${vendor.name} has been ${action}d successfully.`)
        }
      } catch (error) {
        console.error(`Error ${action}ing vendor:`, error)
        alert(`Failed to ${action} vendor. Please try again.`)
      }
    }
  }

  const handleExportVendors = () => {
    try {
      // Prepare CSV data
      const headers = ['Name', 'Vendor Code', 'Company Name', 'Email', 'Phone', 'Category', 'Status', 'Address', 'Payment Terms', 'Credit Limit', 'Current Balance']
      
      const csvData = vendors.map(vendor => {
        const primaryContact = getPrimaryContact(vendor)
        return [
          vendor.name || '',
          vendor.vendorCode || '',
          vendor.companyName || '',
          primaryContact?.email || vendor.email || '',
          primaryContact?.phone || vendor.phone || '',
          getCategoryDisplay(vendor.category),
          getStatusDisplay(vendor.status),
          vendor.fullAddress || `${vendor.address?.city || ''}, ${vendor.address?.country || ''}`,
          vendor.paymentTerms?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '',
          vendor.creditLimit?.toString() || '0',
          vendor.currentBalance?.toString() || '0'
        ]
      })

      // Create CSV content
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `vendors_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting vendors:', error)
      alert('Failed to export vendors. Please try again.')
    }
  }

  return (
    <DashboardLayout title="Vendor Management" description="Manage and monitor your vendor relationships">
      <div className="space-y-6">
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
            <span>Add New Vendor</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search vendors..."
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
                <option value="raw_materials">Raw Materials</option>
                <option value="packaging">Packaging</option>
                <option value="logistics">Logistics</option>
                <option value="services">Services</option>
                <option value="equipment">Equipment</option>
                <option value="technology">Technology</option>
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
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleExportVendors}
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

        {/* Vendors Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vendors</h2>
            <p className="text-sm text-gray-600 mt-1">{total} total vendors</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
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
                        <span>Loading vendors...</span>
                      </div>
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                        </svg>
                        <span>No vendors found</span>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {vendor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                            <div className="text-sm text-gray-500">{vendor.vendorCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        <span className="capitalize">{vendor.category.replace('_', ' ')}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {vendor.contacts && vendor.contacts.length > 0 ? (
                          <div>
                            <div>{vendor.contacts[0].name}</div>
                            <div className="text-xs">{vendor.contacts[0].email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No contact</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        <span className="capitalize">{vendor.paymentTerms.replace('_', ' ')}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewVendor(vendor)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditVendor(vendor)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            Edit
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

        {/* Add Vendor Modal */}
        <AddVendorModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadVendors}
        />

        {/* View Vendor Modal */}
        <ViewVendorModal 
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          vendor={selectedVendor}
        />

        {/* Edit Vendor Modal */}
        <EditVendorModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          vendor={selectedVendor}
          onSuccess={loadVendors}
        />
      </div>
    </DashboardLayout>
  )
} 