'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { DashboardSidebar } from '@/components/ui/DashboardSidebar'


export default function AccountSettings() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Profile form data
  const [profileFormData, setProfileFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    orderUpdates: true
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30
  })

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Notification settings updated successfully!')
    } catch (error) {
      alert('Failed to update notification settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="flex">
          <DashboardSidebar 
            isOpen={sidebarOpen} 
            setIsOpen={setSidebarOpen} 
          />
          
          <main className="flex-1 dashboard-content pt-16">
            <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading settings...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
        />

        <main className="flex-1 dashboard-content pt-16">
          <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <p className="text-gray-600 mt-1">Update your personal details and contact information.</p>
                </div>
                
                <form onSubmit={handleProfileSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={profileFormData.firstName}
                        onChange={(e) => setProfileFormData({...profileFormData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your first name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={profileFormData.lastName}
                        onChange={(e) => setProfileFormData({...profileFormData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your last name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profileFormData.email}
                        onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-gray-600 mt-1">Choose how you want to be notified about updates and activities.</p>
                </div>
                
                <form onSubmit={handleNotificationSubmit} className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({...notificationSettings, pushNotifications: !notificationSettings.pushNotifications})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Weekly Reports</h3>
                        <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({...notificationSettings, weeklyReports: !notificationSettings.weeklyReports})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationSettings.weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationSettings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Order Updates</h3>
                        <p className="text-sm text-gray-500">Get notified about order status changes</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({...notificationSettings, orderUpdates: !notificationSettings.orderUpdates})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationSettings.orderUpdates ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationSettings.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security and privacy preferences.</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings({...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          securitySettings.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div>
                      <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <select
                        id="sessionTimeout"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Password Management</h3>
                      <div className="space-y-3">
                        <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                          Change Password
                        </button>
                        <button className="w-full sm:w-auto px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 ml-0 sm:ml-3">
                          Reset All Sessions
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => alert('Security settings updated!')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Security Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
