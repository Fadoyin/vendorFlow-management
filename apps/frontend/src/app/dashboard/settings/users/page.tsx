'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  createdAt: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Mock users data
      const mockUsers: User[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'admin',
          status: 'active',
          lastLogin: '2024-01-15',
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          role: 'vendor',
          status: 'active',
          lastLogin: '2024-01-14',
          createdAt: '2024-01-02'
        }
      ]
      setUsers(mockUsers)
      setError(null)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="User Management" description="Manage system users and their permissions">
      <div className="space-y-6">
        {/* User management content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Users</h2>
          
          {loading ? (
            <p className="text-gray-600">Loading users...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900 capitalize">{user.role}</p>
                      <p className="text-xs text-gray-500">Last login: {user.lastLogin}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
