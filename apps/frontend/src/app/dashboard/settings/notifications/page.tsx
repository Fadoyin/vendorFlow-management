'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { DashboardSidebar } from '@/components/ui/DashboardSidebar'


export default function NotificationSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [slackNotifications, setSlackNotifications] = useState(false)
  
  // Specific notification types
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [inventoryAlerts, setInventoryAlerts] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)

  const handleSaveSettings = () => {
    // Simulate saving settings
    alert('Notification settings saved successfully!')
  }

  const handleTestNotification = (type: string) => {
    // Simulate sending test notification
    alert(`Test ${type} notification sent!`)
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
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Notification Settings</h1>

              {/* Notification Channels */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Notification Channels</h2>
                  <p className="text-gray-600 mt-1">Choose how you want to receive notifications.</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                          <button
                            onClick={() => handleTestNotification('email')}
                            className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Test
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                          <button
                            onClick={() => handleTestNotification('push')}
                            className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Test
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                          <button
                            onClick={() => handleTestNotification('SMS')}
                            className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Test
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">Receive important alerts via text message</p>
                      </div>
                      <button
                        onClick={() => setSmsNotifications(!smsNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            smsNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Slack Notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">Slack Notifications</h3>
                          <button
                            onClick={() => handleTestNotification('Slack')}
                            className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Test
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">Send notifications to your Slack workspace</p>
                      </div>
                      <button
                        onClick={() => setSlackNotifications(!slackNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          slackNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            slackNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Notification Types</h2>
                  <p className="text-gray-600 mt-1">Choose which types of notifications you want to receive.</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Order Updates */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Order Updates</h3>
                        <p className="text-sm text-gray-500">New orders, status changes, and delivery updates</p>
                      </div>
                      <button
                        onClick={() => setOrderUpdates(!orderUpdates)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          orderUpdates ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            orderUpdates ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Inventory Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Inventory Alerts</h3>
                        <p className="text-sm text-gray-500">Low stock warnings and reorder reminders</p>
                      </div>
                      <button
                        onClick={() => setInventoryAlerts(!inventoryAlerts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          inventoryAlerts ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            inventoryAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* System Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">System Alerts</h3>
                        <p className="text-sm text-gray-500">System maintenance, updates, and downtime notices</p>
                      </div>
                      <button
                        onClick={() => setSystemAlerts(!systemAlerts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          systemAlerts ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            systemAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Weekly Reports */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Weekly Reports</h3>
                        <p className="text-sm text-gray-500">Weekly summary of sales, orders, and performance</p>
                      </div>
                      <button
                        onClick={() => setWeeklyReports(!weeklyReports)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            weeklyReports ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Security Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Security Alerts</h3>
                        <p className="text-sm text-gray-500">Login attempts, password changes, and security issues</p>
                      </div>
                      <button
                        onClick={() => setSecurityAlerts(!securityAlerts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          securityAlerts ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            securityAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Schedule */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Schedule</h2>
                  <p className="text-gray-600 mt-1">Set quiet hours and delivery preferences.</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="quietStart" className="block text-sm font-medium text-gray-700 mb-2">
                        Quiet Hours Start
                      </label>
                      <input
                        type="time"
                        id="quietStart"
                        defaultValue="22:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="quietEnd" className="block text-sm font-medium text-gray-700 mb-2">
                        Quiet Hours End
                      </label>
                      <input
                        type="time"
                        id="quietEnd"
                        defaultValue="08:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      defaultValue="America/New_York"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Settings */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
