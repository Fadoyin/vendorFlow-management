'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { AdminRoute } from '@/components/auth/RoleProtectedRoute'
import { dashboardApi, inventoryApi, ordersApi } from '@/lib/api-client.optimized'
import Link from 'next/link'

// Types
interface DashboardStats {
  orders: {
    total: number;
    todayCount: number;
    pendingCount: number;
    monthlyGrowth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    monthlyGrowth: number;
  };
  vendors: {
    total: number;
    activeCount: number;
    newThisWeek: number;
  };
  inventory: {
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
  };
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
}

// Custom hooks for data fetching
function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setError(null);
      } else {
        setLoading(true);
      }

      // Fetch data in parallel with optimized caching
      const [dashboardResponse, activityResponse, inventoryResponse, ordersResponse] = await Promise.allSettled([
        dashboardApi.getStats({ cache: true, cacheTTL: 60000 }),
        dashboardApi.getActivity(8, { cache: true, cacheTTL: 30000 }),
        inventoryApi.getStats({ cache: true, cacheTTL: 300000 }),
        ordersApi.getStats({ cache: true, cacheTTL: 60000 }),
      ]);

      // Process dashboard stats
      let combinedStats: DashboardStats = {
        orders: { total: 0, todayCount: 0, pendingCount: 0, monthlyGrowth: 0 },
        revenue: { total: 0, thisMonth: 0, monthlyGrowth: 0 },
        vendors: { total: 0, activeCount: 0, newThisWeek: 0 },
        inventory: { totalItems: 0, lowStockCount: 0, totalValue: 0 },
      };

      // Merge data from different sources
      if (dashboardResponse.status === 'fulfilled') {
        const dashData = dashboardResponse.value.data;
        combinedStats = { ...combinedStats, ...dashData };
      }

      if (inventoryResponse.status === 'fulfilled') {
        const invData = inventoryResponse.value.data;
        combinedStats.inventory = {
          totalItems: invData.totalItems || 0,
          lowStockCount: invData.lowStockItems || 0,
          totalValue: invData.totalValue || 0,
        };
      }

      if (ordersResponse.status === 'fulfilled') {
        const orderData = ordersResponse.value.data;
        combinedStats.orders = {
          total: orderData.total || 0,
          todayCount: orderData.todayCount || 0,
          pendingCount: orderData.pendingCount || 0,
          monthlyGrowth: orderData.monthlyGrowth || 0,
        };
      }

      setStats(combinedStats);

      // Process activities
      if (activityResponse.status === 'fulfilled') {
        setActivities(activityResponse.value.data || []);
      }

      setLastRefresh(new Date());
      setError(null);

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    activities,
    loading,
    error,
    lastRefresh,
    loadDashboardData,
  };
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  const formatted = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
  return formatted;
};

const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    order_created: '📋',
    order_updated: '📝',
    inventory_updated: '📦',
    vendor_created: '🏪',
    user_login: '👤',
    payment_processed: '💳',
    default: '📌',
  };
  return icons[type] || icons.default;
};

const getActivityColor = (type: string): string => {
  const colors: Record<string, string> = {
    order_created: 'blue',
    order_updated: 'yellow',
    inventory_updated: 'green',
    vendor_created: 'purple',
    user_login: 'gray',
    payment_processed: 'indigo',
    default: 'gray',
  };
  return colors[type] || colors.default;
};

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <DashboardLayout title="Dashboard" description="Loading your dashboard...">
      <div className="space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <DashboardLayout title="Dashboard" description="Error loading dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function OptimizedDashboard() {
  const {
    stats,
    activities,
    loading,
    error,
    lastRefresh,
    loadDashboardData,
  } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  // Memoized quick actions to prevent unnecessary re-renders
  const quickActions = useMemo(() => [
    { href: '/dashboard/orders', icon: '📄', label: 'New Order', color: 'blue' },
    { href: '/dashboard/inventory', icon: '📦', label: 'Add Inventory', color: 'green' },
    { href: '/dashboard/vendors', icon: '🏪', label: 'Add Vendor', color: 'purple' },
  ], []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !stats) {
    return <ErrorState error={error} onRetry={() => loadDashboardData()} />;
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
                  Last updated: {formatRelativeTime(lastRefresh.toISOString())}
                </span>
              </div>
              {error && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  ⚠️ {error}
                </div>
              )}
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
                    {formatPercentage(stats?.orders.monthlyGrowth || 0)} from last month
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
                    {formatCurrency(stats?.revenue.total || 0)}
                  </p>
                  <p className={`text-sm mt-1 ${
                    (stats?.revenue.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(stats?.revenue.monthlyGrowth || 0)} from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
                <span>This month: {formatCurrency(stats?.revenue.thisMonth || 0)}</span>
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
                    {formatCurrency(stats?.inventory.totalValue || 0)}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all duration-200`}
                >
                  <span className="text-2xl mb-2">{action.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </Link>
              ))}
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
                  const color = getActivityColor(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center`}>
                        <span className={`text-${color}-600 text-sm`}>
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                      {activity.entityId && (
                        <div className="text-xs text-gray-400">
                          ID: {activity.entityId.slice(-6)}
                        </div>
                      )}
                    </div>
                  );
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
  );
} 