'use client'

import { useState, useEffect } from 'react'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import ChangePasswordModal from '@/components/auth/ChangePasswordModal'

export default function VendorProfile() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  // Profile form data - will be populated from API
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: ''
  })

  // Company settings - will be populated from API
  const [companyData, setCompanyData] = useState({
    companyName: '',
    businessType: '',
    taxId: '',
    website: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    lastPasswordChange: '',
    activeSessions: 1
  })

  // Load user profile data from API
  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const response = await fetch('http://localhost:3004/api/users/profile', { headers })
      console.log('Profile response status:', response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log('Profile data:', userData)

        // Update profile data
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          avatar: userData.avatar || ''
        })

        // Update company data
        setCompanyData({
          companyName: userData.companyName || '',
          businessType: userData.businessType || '',
          taxId: userData.taxId || '',
          website: userData.website || '',
          description: '', // Description not available in user schema
          address: {
            street: userData.streetAddress || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zipCode || '',
            country: userData.country || ''
          }
        })

        // Update security settings
        setSecuritySettings({
          twoFactorEnabled: userData.twoFactorEnabled || false,
          lastPasswordChange: userData.updatedAt ? new Date(userData.updatedAt).toISOString().split('T')[0] : '',
          activeSessions: 1 // This would need to come from session management
        })

      } else {
        setError('Failed to load profile data')
      }
    } catch (err) {
      console.error('Error loading profile data:', err)
      setError('Failed to load profile data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Combine profile and company data for the update
      const updateData: any = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        companyName: companyData.companyName,
        businessType: companyData.businessType,
        taxId: companyData.taxId,
        streetAddress: companyData.address.street,
        city: companyData.address.city,
        state: companyData.address.state,
        zipCode: companyData.address.zipCode,
        country: companyData.address.country
      }

      // Only include website if it's not empty and looks like a URL
      if (companyData.website && companyData.website.trim() !== '') {
        updateData.website = companyData.website
      }

      const response = await fetch('http://localhost:3004/api/users/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        console.log('Profile updated successfully')
        setError(null) // Clear any previous errors
        setSuccess('Profile updated successfully!')
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Profile update error:', errorData)
        setError(errorData.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const updateData: any = {
        companyName: companyData.companyName,
        businessType: companyData.businessType,
        taxId: companyData.taxId,
        streetAddress: companyData.address.street,
        city: companyData.address.city,
        state: companyData.address.state,
        zipCode: companyData.address.zipCode,
        country: companyData.address.country
      }

      // Only include website if it's not empty and looks like a URL
      if (companyData.website && companyData.website.trim() !== '') {
        updateData.website = companyData.website
      }

      const response = await fetch('http://localhost:3004/api/users/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        console.log('Company settings updated successfully')
        setError(null) // Clear any previous errors
        setSuccess('Company settings updated successfully!')
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Company update error:', errorData)
        setError(errorData.message || 'Failed to update company settings')
      }
    } catch (err) {
      console.error('Error updating company settings:', err)
      setError('Failed to update company settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: '👤' },
    { id: 'company', name: 'Company Settings', icon: '🏢' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ]

  if (loading) {
    return (
      <VendorRoute>
        <DashboardLayout title="Profile Settings" description="Manage your account and company settings">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profile data...</span>
          </div>
        </DashboardLayout>
      </VendorRoute>
    )
  }

  if (error) {
    return (
      <VendorRoute>
        <DashboardLayout title="Profile Settings" description="Manage your account and company settings">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Profile</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadProfileData}
                    className="bg-red-100 px-2 py-1 text-sm text-red-800 rounded hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </VendorRoute>
    )
  }

  return (
    <VendorRoute>
      <DashboardLayout title="Profile Settings" description="Manage your account information, company details, and preferences">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200">

            {/* Tab Navigation */}
            <nav className="mt-6 -mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

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
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Personal Information</h3>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xl font-medium text-gray-700">
                          {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Change Avatar
                      </button>
                      <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Company Settings Tab */}
          {activeTab === 'company' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Company Information</h3>

                <form onSubmit={handleCompanySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyData.companyName}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Business Type
                      </label>
                      <select
                        value={companyData.businessType}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, businessType: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select business type</option>
                        <option value="Technology">Technology</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Services">Services</option>
                        <option value="Retail">Retail</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={companyData.taxId}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, taxId: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <input
                        type="url"
                        value={companyData.website}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Company Description
                      </label>
                      <textarea
                        rows={3}
                        value={companyData.description}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of your company..."
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Business Address</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={companyData.address.street}
                          onChange={(e) => setCompanyData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          value={companyData.address.city}
                          onChange={(e) => setCompanyData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={companyData.address.state}
                          onChange={(e) => setCompanyData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, state: e.target.value }
                          }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          ZIP/Postal Code
                        </label>
                        <input
                          type="text"
                          value={companyData.address.zipCode}
                          onChange={(e) => setCompanyData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, zipCode: e.target.value }
                          }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <select
                          value={companyData.address.country}
                          onChange={(e) => setCompanyData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, country: e.target.value }
                          }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select country</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Section */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Password & Security</h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Password</h4>
                        <p className="text-sm text-gray-500">
                          Last changed on {securitySettings.lastPasswordChange}
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowChangePasswordModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings(prev => ({ 
                          ...prev, 
                          twoFactorEnabled: !prev.twoFactorEnabled 
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          securitySettings.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          setSuccess('Password changed successfully!')
          setTimeout(() => setSuccess(null), 3000)
        }}
      />
    </VendorRoute>
  )
}
