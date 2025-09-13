'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { AdminRoute } from '@/components/auth/RoleProtectedRoute'
import { dashboardApi, type DashboardStats, type ActivityLog } from '@/lib/dashboard-api'
import Link from 'next/link'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load dashboard data
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Fetch stats and activity in parallel
      const [dashboardStats, recentActivity] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getRecentActivity(8)
      ])

      setStats(dashboardStats)
      setActivities(recentActivity)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [loadDashboardData])

  // Manual refresh handler
  const handleRefresh = () => {
    loadDashboardData(true)
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" description="Loading your dashboard...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <AdminRoute>
      <DashboardLayout title="Admin Dashboard" description="Welcome to your VendorFlow dashboard">
        <div className="space-y-8">
        {/* Refresh Bar */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">
                Last updated: {dashboardApi.formatRelativeTime(lastRefresh.toISOString())}
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              refreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Orders Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.orders.total.toLocaleString() || '0'}
                </p>
                <p className={`text-sm mt-1 ${
                  (stats?.orders.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardApi.formatPercentage(stats?.orders.monthlyGrowth || 0)} from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
              <span>Today: {stats?.orders.todayCount || 0}</span>
              <span>Pending: {stats?.orders.pendingCount || 0}</span>
            </div>
          </div>
          
          {/* Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardApi.formatCurrency(stats?.revenue.total || 0)}
                </p>
                <p className={`text-sm mt-1 ${
                  (stats?.revenue.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardApi.formatPercentage(stats?.revenue.monthlyGrowth || 0)} from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
              <span>This month: {dashboardApi.formatCurrency(stats?.revenue.thisMonth || 0)}</span>
            </div>
          </div>
          
          {/* Active Vendors Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Active Vendors</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.vendors.total.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {stats?.vendors.newThisWeek || 0} new this week
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
              <span>Active: {stats?.vendors.activeCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inventory Items</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.inventory.totalItems.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {stats?.inventory.lowStockCount || '0'}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {dashboardApi.formatCurrency(stats?.inventory.totalValue || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">💎</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Today's Orders</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {stats?.orders.todayCount || '0'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/orders" className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
              <span className="text-2xl mb-2">📄</span>
              <span className="text-sm font-medium text-gray-700">New Order</span>
            </Link>
            <Link href="/dashboard/inventory" className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
              <span className="text-2xl mb-2">📦</span>
              <span className="text-sm font-medium text-gray-700">Add Inventory</span>
            </Link>
            <Link href="/dashboard/vendors" className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
              <span className="text-2xl mb-2">🏪</span>
              <span className="text-sm font-medium text-gray-700">Add Vendor</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => {
                const color = dashboardApi.getActivityColor(activity.type)
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center`}>
                      <span className={`text-${color}-600 text-sm`}>
                        {dashboardApi.getActivityIcon(activity.type)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dashboardApi.formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                    {activity.entityId && (
                      <div className="text-xs text-gray-400">
                        ID: {activity.entityId.slice(-6)}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-gray-500 text-sm">No recent activity to display</p>
                <p className="text-gray-400 text-xs mt-1">Activity will appear here as you use the system</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </DashboardLayout>
    </AdminRoute>
  )
}
