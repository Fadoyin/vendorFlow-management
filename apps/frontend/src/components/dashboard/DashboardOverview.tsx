'use client'

import React, { useEffect, useState } from 'react'
import { analyticsApi, type DashboardStats, type KPIReport } from '@/lib/api'

interface DashboardData {
  timestamp: string;
  tenantId: string;
  userRole: string;
  orders: {
    total: number;
    totalAmount: number;
    avgOrderValue: number;
    pendingCount: number;
    completedCount: number;
    cancelledCount: number;
    statusBreakdown: Record<string, number>;
  };
  suppliers: {
    total: number;
    activeCount: number;
    categoryBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
  };
  vendors: {
    total: number;
    activeCount: number;
    categoryBreakdown: Record<string, number>;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStock: number;
  };
  forecasts: {
    total: number;
    avgAccuracy: number;
    recentForecasts: number;
    methodBreakdown: Record<string, number>;
  };
  payments: {
    totalRevenue: number;
    totalTransactions: number;
    avgTransactionValue: number;
    statusBreakdown: Record<string, number>;
  };
  notifications: {
    total: number;
    unread: number;
  };
  stockAlerts: Array<{
    name: string;
    sku: string;
    currentStock: number;
    minimumStock: number;
    category: string;
  }>;
  recentActivity: Array<{
    type: string;
    id: string;
    title: string;
    description: string;
    timestamp: string;
    vendor?: string;
    supplier?: string;
  }>;
  summary: {
    totalOrders: number;
    totalSuppliers: number;
    totalVendors: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockItems: number;
    unreadNotifications: number;
    activeUsers: number;
  };
}

export function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [kpiData, setKpiData] = useState<KPIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch dashboard stats and KPI report in parallel
      const [statsResponse, kpiResponse] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getKPIReport()
      ]);

      if (statsResponse.error) {
        throw new Error(statsResponse.error);
      }

      if (kpiResponse.error) {
        throw new Error(kpiResponse.error);
      }

      setDashboardData(statsResponse.data);
      setKpiData(kpiResponse.data);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={loadDashboardData}
              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m0 0L9 9l-4-4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Start by creating some orders or inventory items to see analytics.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard Overview</h2>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.summary.totalOrders)}</p>
              <p className="text-sm text-gray-600">{dashboardData.orders.pendingCount} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.summary.totalRevenue)}</p>
              <p className="text-sm text-gray-600">Avg: {formatCurrency(dashboardData.orders.avgOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inventory Items</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.inventory.totalItems)}</p>
              <p className="text-sm text-red-600">{dashboardData.inventory.lowStockCount} low stock</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.summary.activeUsers)}</p>
              <p className="text-sm text-gray-600">{dashboardData.summary.unreadNotifications} notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Alerts</h3>
          {dashboardData.stockAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No stock alerts at this time</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.stockAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{alert.name}</p>
                    <p className="text-sm text-gray-600">SKU: {alert.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {alert.currentStock} / {alert.minimumStock}
                    </p>
                    <p className="text-xs text-gray-500">{alert.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          {dashboardData.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    {(activity.vendor || activity.supplier) && (
                      <p className="text-xs text-gray-400">
                        {activity.vendor && `Vendor: ${activity.vendor}`}
                        {activity.supplier && `Supplier: ${activity.supplier}`}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary */}
      {kpiData && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{kpiData.orderFulfillmentRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Order Fulfillment</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{kpiData.vendorSatisfactionScore.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Vendor Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{kpiData.inventoryTurnoverRate.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Inventory Turnover</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{kpiData.forecastAccuracy.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Forecast Accuracy</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
