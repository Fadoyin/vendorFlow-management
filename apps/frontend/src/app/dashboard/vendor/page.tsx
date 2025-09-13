'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'
import { vendorApi } from '@/lib/api'

interface DashboardData {
  totalOrders: number;
  revenue: number;
  products: number;
  growth: number;
  recentOrders: Array<{
    orderId: string;
    customerName: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function VendorDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalOrders: 0,
    revenue: 0,
    products: 0,
    growth: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await vendorApi.getDashboard();
      
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'placed':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <VendorRoute>
        <DashboardLayout title="Vendor Dashboard" description="Manage your vendor operations">
          <div className="space-y-6">
            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-md"></div>
                      <div className="ml-5 w-0 flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-6 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-4 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-20 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </VendorRoute>
    );
  }

  return (
    <VendorRoute>
      <DashboardLayout title="Vendor Dashboard" description="Manage your vendor operations">
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <button
                    onClick={loadDashboardData}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData.totalOrders.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(dashboardData.revenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Products</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData.products.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    dashboardData.growth >= 0 ? 'bg-purple-500' : 'bg-red-500'
                  }`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        dashboardData.growth >= 0 
                          ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                          : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      } />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Growth</dt>
                    <dd className={`text-lg font-medium ${
                      dashboardData.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.growth >= 0 ? '+' : ''}{dashboardData.growth.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              </div>
              <div className="p-6">
                {dashboardData.recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentOrders.map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.orderId}</p>
                          <p className="text-sm text-gray-500">{order.customerName}</p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent orders found</p>
                  </div>
                )}
                <div className="mt-6">
                  <Link href="/dashboard/vendor/orders" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View all orders →
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/dashboard/vendor/inventory" className="group relative rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Manage Inventory</h3>
                      <p className="mt-1 text-sm text-gray-500">Add or update products</p>
                    </div>
                  </Link>

                  <Link href="/dashboard/vendor/orders" className="group relative rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all duration-200">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600">View Orders</h3>
                      <p className="mt-1 text-sm text-gray-500">Track and manage orders</p>
                    </div>
                  </Link>

                  <Link href="/dashboard/vendor/forecasting" className="group relative rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-600">Forecasting</h3>
                      <p className="mt-1 text-sm text-gray-500">Demand insights & analytics</p>
                    </div>
                  </Link>

                  <Link href="/dashboard/vendor/profile" className="group relative rounded-lg p-4 border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all duration-200">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-600 group-hover:bg-gray-100">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600">Profile</h3>
                      <p className="mt-1 text-sm text-gray-500">Account preferences</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </VendorRoute>
  )
}
