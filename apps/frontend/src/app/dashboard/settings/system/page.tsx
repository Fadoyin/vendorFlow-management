'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

export default function SystemSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [systemUpdates, setSystemUpdates] = useState(false)

  return (
    <DashboardLayout title="System Settings" description="Configure system preferences and settings">
      <div className="space-y-6">
        {/* System Preferences content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Preferences</h2>
          <p className="text-gray-600">Configure your system settings and preferences here.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
