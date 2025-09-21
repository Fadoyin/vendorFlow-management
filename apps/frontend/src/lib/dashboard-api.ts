// Dashboard API service for fetching real-time dashboard data
import { apiService } from './api'

export interface DashboardStats {
  orders: {
    total: number
    monthlyGrowth: number
    todayCount: number
    pendingCount: number
  }
  revenue: {
    total: number
    monthlyGrowth: number
    thisMonth: number
    lastMonth: number
  }
  vendors: {
    total: number
    newThisWeek: number
    activeCount: number
  }
  inventory: {
    totalItems: number
    lowStockCount: number
    totalValue: number
  }
}

export interface ActivityLog {
  id?: string
  _id?: string
  type: 'order' | 'inventory' | 'vendor' | 'payment' | 'user' | 'system'
  action: string
  description: string
  timestamp: string
  userId?: string
  entityId?: string
  entityType?: string
  metadata?: Record<string, any>
}

class DashboardApiService {
  // Get comprehensive dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('🔄 Fetching admin dashboard stats...')
      
      // Use the new admin dashboard stats endpoint for real-time data
      const response = await apiService.request('/users/admin/dashboard-stats', {
        method: 'GET'
      })
      
      console.log('📊 Dashboard stats API response:', response)
      
      if (response.error) {
        console.error('❌ Dashboard stats API error:', response.error)
        throw new Error(response.error)
      }

      const statsData = {
        orders: {
          total: response.data?.orders?.total || 0,
          monthlyGrowth: response.data?.orders?.monthlyGrowth || 0,
          todayCount: response.data?.orders?.todayCount || 0,
          pendingCount: response.data?.orders?.pendingCount || 0
        },
        revenue: {
          total: response.data?.revenue?.total || 0,
          monthlyGrowth: response.data?.revenue?.monthlyGrowth || 0,
          thisMonth: response.data?.revenue?.thisMonth || 0,
          lastMonth: response.data?.revenue?.lastMonth || 0
        },
        vendors: {
          total: response.data?.vendors?.total || 0,
          newThisWeek: response.data?.vendors?.newThisWeek || 0,
          activeCount: response.data?.vendors?.activeCount || 0
        },
        inventory: {
          totalItems: response.data?.inventory?.totalItems || 0,
          lowStockCount: response.data?.inventory?.lowStockCount || 0,
          totalValue: response.data?.inventory?.totalValue || 0
        }
      }
      
      console.log('✅ Processed dashboard stats:', statsData)
      return statsData
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error)
      console.log('🔄 Falling back to individual API calls...')
      
      // Fallback to individual API calls if main endpoint fails
      return this.getFallbackStatsFromIndividualAPIs()
    }
  }

  // Get orders statistics
  private async getOrdersStats() {
    try {
      const response = await apiService.request('/orders/dashboard-stats', {
        method: 'GET'
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      return {
        total: response.data?.totalOrders || 0,
        monthlyGrowth: response.data?.monthlyGrowth || 0,
        todayCount: response.data?.todayCount || 0,
        pendingCount: response.data?.pendingCount || 0
      }
    } catch (error) {
      console.error('Error fetching orders stats:', error)
      return {
        total: 0,
        monthlyGrowth: 0,
        todayCount: 0,
        pendingCount: 0
      }
    }
  }

  // Get vendors statistics  
  private async getVendorsStats() {
    try {
      const response = await apiService.request('/vendors/stats', {
        method: 'GET'
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      return {
        total: response.data?.totalVendors || 0,
        newThisWeek: response.data?.newThisWeek || 0,
        activeCount: response.data?.activeCount || 0
      }
    } catch (error) {
      console.error('Error fetching vendors stats:', error)
      return {
        total: 0,
        newThisWeek: 0,
        activeCount: 0
      }
    }
  }

  // Get inventory statistics
  private async getInventoryStats() {
    try {
      const response = await apiService.request('/inventory/stats', {
        method: 'GET'
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      return {
        totalItems: response.data?.totalItems || 0,
        lowStockCount: response.data?.lowStockCount || 0,
        totalValue: response.data?.totalValue || 0
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
      return {
        totalItems: 0,
        lowStockCount: 0,
        totalValue: 0
      }
    }
  }

  // Get payments/revenue statistics
  private async getPaymentsStats() {
    try {
      const response = await apiService.request('/payments/stats', {
        method: 'GET'
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      return {
        total: response.data?.totalRevenue || 0,
        monthlyGrowth: response.data?.monthlyGrowth || 0,
        thisMonth: response.data?.thisMonth || 0,
        lastMonth: response.data?.lastMonth || 0
      }
    } catch (error) {
      console.error('Error fetching payments stats:', error)
      return {
        total: 0,
        monthlyGrowth: 0,
        thisMonth: 0,
        lastMonth: 0
      }
    }
  }

  // Get recent activity logs
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    try {
      console.log(`🔄 Fetching recent activity (limit: ${limit})...`)
      
      const response = await apiService.request(`/activity-logs?limit=${limit}&sort=createdAt:desc`, {
        method: 'GET'
      })
      
      console.log('📋 Activity logs API response:', response)
      
      if (response.error) {
        console.error('❌ Activity logs API error:', response.error)
        throw new Error(response.error)
      }

      // Handle different response formats
      const activities = response.data?.activities || response.data || []
      console.log(`✅ Found ${activities.length} activity logs`)
      
      return activities
    } catch (error) {
      console.error('❌ Error fetching recent activity:', error)
      console.log('🔄 Using fallback activity data...')
      
      // Return fallback activity data
      return this.getFallbackActivity()
    }
  }

  // Create activity log entry
  async createActivityLog(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await apiService.request('/activity-logs', {
        method: 'POST',
        body: JSON.stringify({
          ...activity,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error creating activity log:', error)
    }
  }

  // Fallback to individual API calls when main endpoint fails
  private async getFallbackStatsFromIndividualAPIs(): Promise<DashboardStats> {
    try {
      console.log('🔄 Fetching stats from individual endpoints...')
      
      const [ordersStats, vendorsStats, inventoryStats, paymentsStats] = await Promise.allSettled([
        this.getOrdersStats(),
        this.getVendorsStats(), 
        this.getInventoryStats(),
        this.getPaymentsStats()
      ])

      const stats: DashboardStats = {
        orders: ordersStats.status === 'fulfilled' ? ordersStats.value : {
          total: 0, monthlyGrowth: 0, todayCount: 0, pendingCount: 0
        },
        revenue: paymentsStats.status === 'fulfilled' ? paymentsStats.value : {
          total: 0, monthlyGrowth: 0, thisMonth: 0, lastMonth: 0
        },
        vendors: vendorsStats.status === 'fulfilled' ? vendorsStats.value : {
          total: 0, newThisWeek: 0, activeCount: 0
        },
        inventory: inventoryStats.status === 'fulfilled' ? inventoryStats.value : {
          totalItems: 0, lowStockCount: 0, totalValue: 0
        }
      }

      console.log('📊 Fallback stats assembled:', stats)
      return stats
    } catch (error) {
      console.error('❌ Error in fallback stats:', error)
      return this.getFallbackStats()
    }
  }

  // Fallback stats when all APIs are unavailable
  private getFallbackStats(): DashboardStats {
    return {
      orders: {
        total: 0,
        monthlyGrowth: 0,
        todayCount: 0,
        pendingCount: 0
      },
      revenue: {
        total: 0,
        monthlyGrowth: 0,
        thisMonth: 0,
        lastMonth: 0
      },
      vendors: {
        total: 0,
        newThisWeek: 0,
        activeCount: 0
      },
      inventory: {
        totalItems: 0,
        lowStockCount: 0,
        totalValue: 0
      }
    }
  }

  // Fallback activity when API is unavailable
  private getFallbackActivity(): ActivityLog[] {
    return [
      {
        id: 'fallback-1',
        type: 'order',
        action: 'created',
        description: 'Dashboard loading - no recent activity available',
        timestamp: new Date().toISOString()
      }
    ]
  }

  // Format currency values
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format percentage values
  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  // Format relative time
  formatRelativeTime(timestamp: string): string {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  // Get activity icon based on type
  getActivityIcon(type: string): string {
    switch (type) {
      case 'order':
        return '📋'
      case 'inventory':
        return '📦'
      case 'vendor':
        return '🏪'
      case 'payment':
        return '💰'
      case 'user':
        return '👤'
      default:
        return '📄'
    }
  }

  // Get activity color based on type
  getActivityColor(type: string): string {
    switch (type) {
      case 'order':
        return 'blue'
      case 'inventory':
        return 'green'
      case 'vendor':
        return 'purple'
      case 'payment':
        return 'yellow'
      case 'user':
        return 'gray'
      default:
        return 'gray'
    }
  }
}

export const dashboardApi = new DashboardApiService()
export default dashboardApi 