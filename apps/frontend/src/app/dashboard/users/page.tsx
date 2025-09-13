'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { usersApi } from '@/lib/api'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  department?: string
  jobTitle?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  department?: string
  jobTitle?: string
}

export default function UsersPage() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const isActiveLink = (path: string) => pathname === path

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll()
      
      if (response.data) {
        setUsers(response.data)
      } else {
        console.error('Failed to load users:', response.error)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Create new user
  const createUser = async (userData: CreateUserData) => {
    try {
      setIsSubmitting(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'
      // Clean up the user data - don't send empty strings for optional fields
      const cleanUserData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        ...(userData.department && userData.department.trim() && { department: userData.department }),
        ...(userData.jobTitle && userData.jobTitle.trim() && { jobTitle: userData.jobTitle })
      }

      const response = await usersApi.create(cleanUserData);
      
      if (response.data) {
        setUsers(prevUsers => [...prevUsers, response.data])
        setIsAddModalOpen(false)
        return { success: true }
      } else {
        console.error('User creation failed:', response.error)
        return { success: false, error: response.error || 'Failed to create user' }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update user
  const updateUser = async (userId: string, userData: Partial<CreateUserData>) => {
    try {
      setIsSubmitting(true)
      
      // Clean up the user data - don't send empty strings for optional fields
      const cleanUserData = {
        ...(userData.firstName && { firstName: userData.firstName }),
        ...(userData.lastName && { lastName: userData.lastName }),
        ...(userData.email && { email: userData.email }),
        ...(userData.role && { role: userData.role }),
        ...(userData.department && userData.department.trim() && { department: userData.department }),
        ...(userData.jobTitle && userData.jobTitle.trim() && { jobTitle: userData.jobTitle })
      }

      const response = await usersApi.update(userId, cleanUserData)

      if (response.data) {
        setUsers(prevUsers => prevUsers.map(user => 
          user._id === userId ? response.data : user
        ))
        setIsEditModalOpen(false)
        setEditingUser(null)
        return { success: true }
      } else {
        console.error('User update failed:', response.error)
        return { success: false, error: response.error || 'Failed to update user' }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete user
  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await usersApi.delete(userId)

      if (response.data !== undefined) {
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId))
        return { success: true }
      } else {
        console.error('User deletion failed:', response.error)
        alert(`Failed to delete user: ${response.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Network error occurred while deleting user')
    }
  }

  // Helper functions
  const formatUserName = (user: User) => `${user.firstName} ${user.lastName}`
  const formatUserStatus = (user: User) => user.isActive ? 'Active' : 'Inactive'
  const formatLastLogin = (user: User) => {
    if (user.lastLoginAt) {
      return new Date(user.lastLoginAt).toLocaleDateString()
    }
    return 'Never'
  }

  // Handle edit button click
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  // Export users to CSV
  const exportUsers = () => {
    try {
      if (filteredUsers.length === 0) {
        alert('No users to export. Please adjust your filters or add users first.')
        return
      }

      // Create CSV content
      const csvHeaders = [
        'Name',
        'Email', 
        'Role',
        'Department',
        'Job Title',
        'Status',
        'Last Login',
        'Created Date'
      ]

      const csvData = filteredUsers.map(user => [
        formatUserName(user),
        user.email,
        user.role.charAt(0).toUpperCase() + user.role.slice(1),
        user.department || 'N/A',
        user.jobTitle || 'N/A', 
        formatUserStatus(user),
        formatLastLogin(user),
        new Date(user.createdAt).toLocaleDateString()
      ])

      // Combine headers and data
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        const fileName = `users-export-${new Date().toISOString().split('T')[0]}.csv`
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Show success message
        alert(`Successfully exported ${filteredUsers.length} users to ${fileName}`)
      }
    } catch (error) {
      console.error('Error exporting users:', error)
      alert('Failed to export users. Please try again.')
    }
  }

  // Filter users based on role and status
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter.toLowerCase()
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    const matchesSearch = formatUserName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesRole && matchesStatus && matchesSearch
  })

  return (
    <AdminRoute>
      <DashboardLayout title="User Management" description="Manage system users and their permissions" 
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-8">
            <div>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New User</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search users..."
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="viewer">Viewer</option>
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
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={exportUsers}
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

          {/* System Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Users</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">Loading users...</div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">No users found</div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{formatUserName(user)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.department || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatUserStatus(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatLastLogin(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteUser(user._id, formatUserName(user))}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
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
        </div>

        {/* Add New User Modal */}
        {isAddModalOpen && (
          <AddUserModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={createUser}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingUser(null)
            }}
            onSubmit={(userData) => updateUser(editingUser._id, userData)}
            isSubmitting={isSubmitting}
            user={editingUser}
          />
        )}
      </DashboardLayout>
    </AdminRoute>
  )
}

// Edit User Modal Component
interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: Partial<CreateUserData>) => Promise<{ success: boolean; error?: string }>
  isSubmitting: boolean
  user: User
}

const EditUserModal = ({ isOpen, onClose, onSubmit, isSubmitting, user }: EditUserModalProps) => {
  const [formData, setFormData] = useState<Partial<CreateUserData>>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    department: user.department,
    jobTitle: user.jobTitle
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    const result = await onSubmit(formData)
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Failed to update user')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role || 'staff'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., IT, Operations, Finance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={formData.jobTitle || ''}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., System Administrator, Analyst"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add User Modal Component
interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: CreateUserData) => Promise<{ success: boolean; error?: string }>
  isSubmitting: boolean
}

const AddUserModal = ({ isOpen, onClose, onSubmit, isSubmitting }: AddUserModalProps) => {
  const [formData, setFormData] = useState<CreateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'vendor',
    department: undefined,
    jobTitle: undefined
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (formData.password.length < 8 || !passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      return
    }

    const result = await onSubmit(formData)
    if (result.success) {
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'vendor',
        department: undefined,
        jobTitle: undefined
      })
      onClose()
    } else {
      setError(result.error || 'Failed to create user')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 8 chars, include uppercase, lowercase, number, special char"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="vendor">Vendor</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., IT, Operations, Finance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={formData.jobTitle || ''}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., System Administrator, Analyst"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
