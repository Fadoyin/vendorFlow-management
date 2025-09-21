'use client'

import { useState, useEffect } from 'react'
import { paymentsApi, inventoryApi } from '@/lib/api'
import Link from 'next/link'

interface SubscriptionData {
  plan?: string
  status?: string
  currentPeriodEnd?: string
  features?: string[]
  itemLimit?: number
}

interface InventoryStats {
  totalItems?: number
  lowStockItems?: number
  totalValue?: number
}

export function SubscriptionAndInventoryCard() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load subscription and inventory data in parallel
      const [subscriptionResponse, inventoryResponse] = await Promise.all([
        paymentsApi.getCurrentSubscription().catch(() => null),
        inventoryApi.getStats().catch(() => null)
      ])

      // Process subscription data
      if (subscriptionResponse?.data) {
        setSubscription(subscriptionResponse.data)
      } else {
        // Default values if no subscription
        setSubscription({
          plan: 'Free',
          status: 'active',
          itemLimit: 10
        })
      }

      // Process inventory data
      if (inventoryResponse?.data?.overview) {
        const overview = inventoryResponse.data.overview
        setInventoryStats({
          totalItems: overview.totalItems || 0,
          lowStockItems: overview.lowStockItems || 0,
          totalValue: overview.totalStockValue || 0
        })
      } else {
        // Default values if no inventory stats
        setInventoryStats({
          totalItems: 0,
          lowStockItems: 0,
          totalValue: 0
        })
      }

    } catch (err) {
      console.error('Error loading subscription and inventory data:', err)
      setError('Failed to load subscription and inventory information')
      
      // Set default values on error
      setSubscription({
        plan: 'Free',
        status: 'active',
        itemLimit: 10
      })
      setInventoryStats({
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    // For very large numbers, use compact notation
    if (amount >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(amount)
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'pro':
      case 'premium':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'business':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'enterprise':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Account Overview</h3>
          {error && (
            <button
              onClick={loadData}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Retry
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Subscription Plan Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Subscription Plan</h4>
              <Link
                href="/dashboard/subscription-plans"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Manage
              </Link>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPlanColor(subscription?.plan || 'free')}`}>
                  {subscription?.plan || 'Free'} Plan
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription?.status || 'active')}`}>
                  {subscription?.status || 'active'}
                </span>
              </div>
              
              {subscription?.itemLimit && (
                <p className="text-sm text-gray-600">
                  Item Limit: {subscription.itemLimit} items
                </p>
              )}
              
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Inventory Overview Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Inventory Overview</h4>
              <Link
                href="/dashboard/supplier/inventory"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-cols-fr">
              <div className="text-center p-3 bg-gray-50 rounded-lg min-w-0 flex-1">
                <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 break-words">
                  {inventoryStats?.totalItems || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Items</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg min-w-0 flex-1">
                <div className="text-lg md:text-xl lg:text-2xl font-semibold text-red-600 break-words">
                  {inventoryStats?.lowStockItems || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Low Stock</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg min-w-0 flex-1 overflow-hidden">
                <div 
                  className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-green-600 break-words leading-tight overflow-hidden text-ellipsis" 
                  style={{ 
                    minHeight: '1.5rem',
                    maxWidth: '100%',
                    wordBreak: 'break-all',
                    hyphens: 'auto'
                  }}
                  title={`Full value: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inventoryStats?.totalValue || 0)}`}
                >
                  {(() => {
                    const value = inventoryStats?.totalValue || 0;
                    if (value >= 1000000) {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `$${(value / 1000).toFixed(1)}K`;
                    } else {
                      return formatCurrency(value);
                    }
                  })()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Value</div>
              </div>
            </div>
          </div>

          {/* Usage Progress (if applicable) */}
          {subscription?.itemLimit && inventoryStats?.totalItems !== undefined && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Plan Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Used</span>
                  <span className="text-gray-900">
                    {inventoryStats.totalItems} / {subscription.itemLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (inventoryStats.totalItems / subscription.itemLimit) > 0.8
                        ? 'bg-red-500'
                        : (inventoryStats.totalItems / subscription.itemLimit) > 0.6
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((inventoryStats.totalItems / subscription.itemLimit) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                {(inventoryStats.totalItems / subscription.itemLimit) > 0.8 && (
                  <p className="text-xs text-red-600">
                    You're approaching your plan limit. Consider upgrading.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 