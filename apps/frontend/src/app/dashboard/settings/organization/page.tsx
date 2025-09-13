'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

export default function OrganizationSettings() {
  const [activeTab, setActiveTab] = useState('organization')

  const navigationItems = [
    { id: 'account', name: 'Account Settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ), href: '/dashboard/settings' },
    { id: 'organization', name: 'Organization Settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ), href: '/dashboard/settings/organization' },
    { id: 'users', name: 'User Management', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ), href: '/dashboard/settings/users' },
    { id: 'system', name: 'System Preferences', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ), href: '/dashboard/settings/system' },
    { id: 'notifications', name: 'Notification Settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V5a2.5 2.5 0 012.5-2.5h11a2.5 2.5 0 012.5 2.5v12a2.5 2.5 0 01-2.5 2.5h-11z" />
      </svg>
    ), href: '/dashboard/settings/notifications' }
  ]

  return (
    <DashboardLayout title="Organization Settings" description="Manage your organization settings and preferences">
      <div className="space-y-6">
        {/* Company/Vendor Details Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Company/Vendor Details</h2>
          
          <div className="flex items-start space-x-6 mb-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="flex flex-col space-y-1">
                  <div className="w-6 h-1 bg-gray-400 rounded"></div>
                  <div className="w-6 h-1 bg-gray-400 rounded"></div>
                  <div className="w-6 h-1 bg-gray-400 rounded"></div>
                </div>
              </div>
              <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Upload Logo
              </Link>
            </div>
            
            {/* Company Form Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  defaultValue="Acme Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                <input
                  type="text"
                  defaultValue="Acme Vendor Solutions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  defaultValue="123 Main St, Anytown, USA 12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                <input
                  type="text"
                  defaultValue="12-3456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  defaultValue="Jane Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Subscription Plan Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Subscription Plan</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-lg font-semibold text-gray-900">Pro Tier - Annual</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Billing Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing Information</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="text-lg font-semibold text-gray-900">Visa ending in 1234 (Expires 12/26)</p>
              </div>
              <Link 
                href="#" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
              >
                View Billing History
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex space-x-3">
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
