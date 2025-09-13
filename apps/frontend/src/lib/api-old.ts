// API service for VendorFlow frontend
const API_BASE_URL = 'http://localhost:3004/api'

interface LoginResponse {
  access_token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    companyName?: string
  }
}

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
  role: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

class ApiService {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async login(email: string, password: string): Promise<{ data: LoginResponse }> {
    // For now, simulate a successful login until backend is ready
    console.log('Login attempt:', { email })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if user registered with mock system
    const storedUserData = localStorage.getItem('mockUserData')
    let mockUser
    
    if (storedUserData) {
      // Use the stored user data from registration
      mockUser = JSON.parse(storedUserData)
    } else {
      // Fallback for direct login without registration
      // For demo purposes, create different users based on email
      if (email.includes('supplier')) {
        mockUser = {
          id: 'mock-supplier-' + Date.now(),
          email: email,
          firstName: 'Demo',
          lastName: 'Supplier',
          role: 'supplier',
          companyName: 'Demo Supplier Company'
        }
      } else if (email.includes('vendor')) {
        mockUser = {
          id: 'mock-vendor-' + Date.now(),
          email: email,
          firstName: 'Demo',
          lastName: 'Vendor',
          role: 'vendor',
          companyName: 'Demo Vendor Company'
        }
      } else {
        mockUser = {
          id: 'mock-user-' + Date.now(),
          email: email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'admin',
          companyName: 'Demo Company'
        }
      }
    }
    
    // Return a mock successful response
    const mockResponse: LoginResponse = {
      access_token: 'mock-jwt-token-' + Date.now(),
      user: mockUser
    }
    
    return { data: mockResponse }
    
    // TODO: Uncomment when backend is ready
    // const response = await this.request('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify({ email, password }),
    // })
    // 
    // return { data: response }
  }

  async register(userData: SignupData) {
    // For now, simulate a successful registration until backend is ready
    console.log('Registration data:', userData)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Store the user data for mock login
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      companyName: userData.companyName,
    }
    
    // Store in localStorage for mock login to use
    localStorage.setItem('mockUserData', JSON.stringify(mockUser))
    
    // Return a mock successful response
    return {
      ...mockUser,
      message: 'Account created successfully! (Mock response - backend not yet ready)'
    }
    
    // TODO: Uncomment when backend is ready
    // return await this.request('/auth/register', {
    //   method: 'POST',
    //   body: JSON.stringify(userData),
    // })
  }

  async getCurrentUser() {
    return await this.request('/auth/profile')
  }

  async logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
  }

  // Inventory methods
  async getInventory() {
    return await this.request('/inventory')
  }

  async createInventoryItem(data: any) {
    return await this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInventoryItem(id: string, data: any) {
    return await this.request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteInventoryItem(id: string) {
    return await this.request(`/inventory/${id}`, {
      method: 'DELETE',
    })
  }

  // Orders methods
  async getOrders() {
    return await this.request('/orders')
  }

  async createOrder(data: any) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrder(id: string, data: any) {
    return await this.request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Suppliers methods
  async getSuppliers() {
    return await this.request('/suppliers')
  }

  async createSupplier(data: any) {
    return await this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSupplier(id: string, data: any) {
    return await this.request(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Vendors methods
  async getVendors() {
    return await this.request('/vendors')
  }

  async createVendor(data: any) {
    return await this.request('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVendor(id: string, data: any) {
    return await this.request(`/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Forecasting methods
  async getForecasts() {
    return await this.request('/forecasting')
  }

  async createForecast(data: any) {
    return await this.request('/forecasting', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Analytics methods
  async getAnalytics() {
    return await this.request('/analytics')
  }

  // Payments methods
  async getPayments() {
    return await this.request('/payments')
  }

  async createPayment(data: any) {
    return await this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

const apiService = new ApiService()
export default apiService

// Export analytics API alias for compatibility
export const analyticsApi = {
  getAnalytics: () => apiService.getAnalytics(),
  
  // Mock dashboard stats until backend is ready
  getDashboardStats: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return mock dashboard statistics
    return {
      totalRevenue: 125840,
      totalOrders: 1247,
      totalCustomers: 856,
      activeVendors: 23,
      recentOrders: [
        {
          id: 'ord-001',
          customerName: 'Acme Corp',
          amount: 2450,
          status: 'completed',
          date: new Date().toISOString(),
        },
        {
          id: 'ord-002', 
          customerName: 'TechStart Ltd',
          amount: 1890,
          status: 'pending',
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'ord-003',
          customerName: 'Global Industries',
          amount: 3200,
          status: 'shipped',
          date: new Date(Date.now() - 172800000).toISOString(),
        }
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 12000 },
        { month: 'Feb', revenue: 15000 },
        { month: 'Mar', revenue: 18000 },
        { month: 'Apr', revenue: 22000 },
        { month: 'May', revenue: 25000 },
        { month: 'Jun', revenue: 28000 }
      ],
      topProducts: [
        { name: 'Product A', sales: 145, revenue: 14500 },
        { name: 'Product B', sales: 132, revenue: 13200 },
        { name: 'Product C', sales: 98, revenue: 9800 }
      ],
      lowStockItems: [
        { name: 'Widget X', stock: 5, reorderLevel: 20 },
        { name: 'Component Y', stock: 3, reorderLevel: 15 },
        { name: 'Material Z', stock: 8, reorderLevel: 25 }
      ]
    }
     },
   
   // Mock KPI report until backend is ready
   getKPIReport: async () => {
     // Simulate API delay
     await new Promise(resolve => setTimeout(resolve, 300))
     
     // Return mock KPI data
     return {
       revenue: {
         current: 125840,
         previous: 118200,
         growth: 6.5,
         target: 130000
       },
       orders: {
         current: 1247,
         previous: 1190,
         growth: 4.8,
         target: 1300
       },
       customers: {
         current: 856,
         previous: 823,
         growth: 4.0,
         target: 900
       },
       conversion: {
         current: 3.2,
         previous: 2.9,
         growth: 10.3,
         target: 3.5
       },
       avgOrderValue: {
         current: 101.25,
         previous: 99.40,
         growth: 1.9,
         target: 105.00
       },
       customerSatisfaction: {
         current: 4.7,
         previous: 4.6,
         growth: 2.2,
         target: 4.8
       }
     }
   },
   
   // Add more analytics methods as needed
}

// Export inventory API for compatibility
export const inventoryApi = {
  getInventory: async () => {
    // Mock inventory data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      items: [
        {
          id: 'inv-001',
          name: 'Widget A',
          sku: 'WGT-A-001',
          quantity: 150,
          lowStockThreshold: 20,
          unitPrice: 25.99,
          category: 'Electronics',
          supplier: 'Acme Corp',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'inv-002',
          name: 'Component B',
          sku: 'CMP-B-002',
          quantity: 8,
          lowStockThreshold: 15,
          unitPrice: 45.50,
          category: 'Components',
          supplier: 'TechCorp',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'inv-003',
          name: 'Material C',
          sku: 'MAT-C-003',
          quantity: 75,
          lowStockThreshold: 25,
          unitPrice: 12.00,
          category: 'Raw Materials',
          supplier: 'MaterialCorp',
          lastUpdated: new Date().toISOString(),
        }
      ],
      totalItems: 3,
      lowStockItems: 1,
      totalValue: 4891.25
    }
  },
  
  updateInventory: async (id: string, data: any) => {
    // Mock update
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Inventory updated successfully' }
  },
  
     addInventoryItem: async (data: any) => {
     // Mock add
     await new Promise(resolve => setTimeout(resolve, 300))
     return { success: true, id: 'inv-' + Date.now(), message: 'Item added successfully' }
   }
}

// Export orders API for compatibility
export const ordersApi = {
  getOrders: async () => {
    // Mock orders data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      orders: [
        {
          id: 'ORD-001',
          customerName: 'Acme Corp',
          items: ['Widget A', 'Component B'],
          totalAmount: 2450.00,
          status: 'pending',
          orderDate: new Date().toISOString(),
          expectedDelivery: '2024-08-15',
        },
        {
          id: 'ORD-002',
          customerName: 'TechCorp Inc',
          items: ['Material C'],
          totalAmount: 890.00,
          status: 'confirmed',
          orderDate: new Date().toISOString(),
          expectedDelivery: '2024-08-12',
        },
        {
          id: 'ORD-003',
          customerName: 'GlobalTech',
          items: ['Widget A', 'Material C'],
          totalAmount: 1250.00,
          status: 'shipped',
          orderDate: new Date().toISOString(),
          expectedDelivery: '2024-08-10',
        }
      ],
      totalOrders: 3,
      pendingOrders: 1,
      totalRevenue: 4590.00
    }
  },
  
  updateOrderStatus: async (orderId: string, status: string) => {
    // Mock update
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Order status updated successfully' }
  },
  
  createOrder: async (orderData: any) => {
    // Mock create
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, id: 'ORD-' + Date.now(), message: 'Order created successfully' }
  }
}

// Export vendors API for compatibility
export const vendorsApi = {
  getVendors: async () => {
    // Mock vendors data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      vendors: [
        {
          id: 'VEN-001',
          name: 'Industrial Supplies Co',
          contactPerson: 'John Smith',
          email: 'john@industrialsupplies.com',
          phone: '+1-555-0123',
          category: 'Manufacturing',
          status: 'active',
          rating: 4.8,
          lastOrder: '2024-07-25',
        },
        {
          id: 'VEN-002',
          name: 'Tech Components Ltd',
          contactPerson: 'Sarah Johnson',
          email: 'sarah@techcomponents.com',
          phone: '+1-555-0124',
          category: 'Electronics',
          status: 'active',
          rating: 4.6,
          lastOrder: '2024-07-23',
        },
        {
          id: 'VEN-003',
          name: 'Material Masters Inc',
          contactPerson: 'Mike Wilson',
          email: 'mike@materialmasters.com',
          phone: '+1-555-0125',
          category: 'Raw Materials',
          status: 'inactive',
          rating: 4.2,
          lastOrder: '2024-06-15',
        }
      ],
      totalVendors: 3,
      activeVendors: 2,
      averageRating: 4.5
    }
  },
  
  updateVendor: async (vendorId: string, data: any) => {
    // Mock update
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Vendor updated successfully' }
  },
  
  addVendor: async (vendorData: any) => {
    // Mock add
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, id: 'VEN-' + Date.now(), message: 'Vendor added successfully' }
  }
}

// Export suppliers API for compatibility
export const suppliersApi = {
  getSuppliers: async () => {
    // Mock suppliers data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      suppliers: [
        {
          id: 'SUP-001',
          name: 'Global Parts Supply',
          contactPerson: 'Emily Chen',
          email: 'emily@globalparts.com',
          phone: '+1-555-0126',
          category: 'Auto Parts',
          status: 'active',
          rating: 4.9,
          lastDelivery: '2024-07-28',
        },
        {
          id: 'SUP-002',
          name: 'Premium Materials Co',
          contactPerson: 'David Brown',
          email: 'david@premiummaterials.com',
          phone: '+1-555-0127',
          category: 'Raw Materials',
          status: 'active',
          rating: 4.7,
          lastDelivery: '2024-07-26',
        },
        {
          id: 'SUP-003',
          name: 'Swift Logistics',
          contactPerson: 'Lisa Martinez',
          email: 'lisa@swiftlogistics.com',
          phone: '+1-555-0128',
          category: 'Logistics',
          status: 'pending',
          rating: 4.3,
          lastDelivery: '2024-07-20',
        }
      ],
      totalSuppliers: 3,
      activeSuppliers: 2,
      averageRating: 4.6
    }
  },
  
  updateSupplier: async (supplierId: string, data: any) => {
    // Mock update
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Supplier updated successfully' }
  },
  
     addSupplier: async (supplierData: any) => {
     // Mock add
     await new Promise(resolve => setTimeout(resolve, 300))
     return { success: true, id: 'SUP-' + Date.now(), message: 'Supplier added successfully' }
   }
}

// Export supplier dashboard API for real-time data
export const supplierDashboardApi = {
  getDashboardStats: async () => {
    try {
      // Get all orders to calculate statistics
      const response = await apiService.request('/orders');
      const orders = Array.isArray(response) ? response : [];
      
      // Calculate order statistics
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((order: any) => order.status === 'placed').length;
      const inProgressOrders = orders.filter((order: any) => 
        order.status === 'confirmed' || order.status === 'dispatched'
      ).length;
      const completedOrders = orders.filter((order: any) => order.status === 'arrived').length;
      
      // Get recent orders (last 5)
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order.orderId,
          item: order.items?.[0]?.stockName || 'N/A',
          status: order.status === 'placed' ? 'Pending' : 
                  order.status === 'confirmed' ? 'Confirmed' : 
                  order.status === 'dispatched' ? 'In Transit' : 
                  order.status === 'arrived' ? 'Completed' : order.status,
          date: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0]
        }));
      
      return {
        stats: {
          totalOrders,
          pending: pendingOrders,
          inProgress: inProgressOrders,
          completed: completedOrders
        },
        recentOrders
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Return empty stats if API fails
      return {
        stats: {
          totalOrders: 0,
          pending: 0,
          inProgress: 0,
          completed: 0
        },
        recentOrders: []
      }
    }
  },
  
  refreshDashboard: async () => {
    // Mock refresh with slightly different data to simulate real updates
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      stats: {
        pendingConfirmation: {
          count: 14,
          percentageChange: 12,
          trend: 'up'
        },
        inTransit: {
          count: 43,
          percentageChange: 3,
          trend: 'up'
        },
        fulfillmentRate: {
          percentage: 98.4,
          percentageChange: 0.3,
          trend: 'up'
        }
      },
      lastUpdated: new Date().toISOString()
    }
  },

  // Get supplier orders with extended data
  getSupplierOrders: async (filters?: { status?: string, orderId?: string, page?: number, limit?: number }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.orderId) params.append('search', filters.orderId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.request(`/orders?${params.toString()}`);
      
      // The response is directly an array of orders, not wrapped in a data property
      const ordersArray = Array.isArray(response) ? response : [];
      
      // Transform backend data to frontend format
      const transformedOrders = ordersArray.map((order: any) => ({
        id: order.orderId,
        item: order.items?.[0]?.stockName || 'N/A',
        status: order.status === 'placed' ? 'Pending' : 
                order.status === 'confirmed' ? 'Confirmed' : 
                order.status === 'dispatched' ? 'In Transit' : 
                order.status === 'arrived' ? 'Completed' : order.status,
        date: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        customer: 'Customer', // Will be populated when customer data is available
        quantity: order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        totalAmount: `$${order.totalAmount?.toFixed(2) || '0.00'}`,
        expectedDelivery: order.expectedArrivalDate?.split('T')[0] || order.expectedDeliveryDate?.split('T')[0] || '',
        urgency: order.priority === 'high' || order.priority === 'urgent' ? 'high' : 
                 order.priority === 'medium' ? 'medium' : 'low',
        orderDate: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));

      return {
        orders: transformedOrders,
        total: transformedOrders.length,
        totalPages: Math.ceil(transformedOrders.length / (filters?.limit || 10)),
        currentPage: filters?.page || 1,
        hasNextPage: (filters?.page || 1) < Math.ceil(transformedOrders.length / (filters?.limit || 10)),
        hasPrevPage: (filters?.page || 1) > 1
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return empty data if API fails
      return {
        orders: [],
        total: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
      };
    }
  },

  // Create a new order
  createOrder: async (orderData: any) => {
    try {
      // Transform frontend form data to backend format
      const backendOrderData = {
        orderId: orderData.id,
        vendorId: '66b5f5e1c45e123456789013', // Default vendor ID - should be dynamic in real app
        supplierId: '66b5f5e1c45e123456789014', // Default supplier ID - should be dynamic in real app
        status: orderData.status === 'Pending' ? 'placed' : 
                orderData.status === 'Confirmed' ? 'confirmed' : 
                orderData.status === 'In Transit' ? 'dispatched' : 
                orderData.status === 'Completed' ? 'arrived' : 'placed',
        priority: 'medium',
        orderDate: orderData.orderDate,
        expectedDeliveryDate: orderData.expectedDelivery || null,
        items: [{
          itemId: '66b5f5e1c45e123456789015', // Default item ID - should be dynamic in real app
          itemName: orderData.item,
          sku: 'SKU-' + Date.now(),
          quantity: orderData.quantity,
          unitPrice: parseFloat(orderData.totalAmount.replace('$', '')) / orderData.quantity,
          description: orderData.item,
          notes: orderData.notes || ''
        }],
        notes: orderData.notes || '',
        currency: 'USD'
      };

      const response = await apiService.request('/orders', {
        method: 'POST',
        body: JSON.stringify(backendOrderData)
      });

      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
}

// Export payments API for compatibility
export const paymentsApi = {
  getPayments: async () => {
    // Mock payments data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      payments: [
        {
          id: 'PAY-001',
          invoiceId: 'INV-001',
          amount: 2450.00,
          status: 'completed',
          method: 'credit_card',
          date: new Date().toISOString(),
          vendor: 'Industrial Supplies Co',
        },
        {
          id: 'PAY-002',
          invoiceId: 'INV-002',
          amount: 890.00,
          status: 'pending',
          method: 'bank_transfer',
          date: new Date().toISOString(),
          vendor: 'Tech Components Ltd',
        },
        {
          id: 'PAY-003',
          invoiceId: 'INV-003',
          amount: 1250.00,
          status: 'failed',
          method: 'credit_card',
          date: new Date().toISOString(),
          vendor: 'Material Masters Inc',
        }
      ],
      totalAmount: 4590.00,
      completedPayments: 1,
      pendingPayments: 1
    }
  },
  
  processPayment: async (paymentData: any) => {
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true, id: 'PAY-' + Date.now(), message: 'Payment processed successfully' }
  }
}

// Export settings API for compatibility
export const settingsApi = {
  getSettings: async () => {
    // Mock settings data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      profile: {
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '+1-555-0199',
        company: 'Demo Company',
      },
      preferences: {
        notifications: true,
        emailNotifications: true,
        smsNotifications: false,
        twoFactorAuth: false,
      },
      system: {
        timezone: 'America/New_York',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
      }
    }
  },
  
  updateSettings: async (settings: any) => {
    // Mock settings update
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Settings updated successfully' }
  }
}

// Export auth API for compatibility
export const authApi = {
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiService.request('/users/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })
  },
  
  enableTwoFactor: async () => {
    // Mock 2FA enable
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, qrCode: 'mock-qr-code-data', message: 'Two-factor authentication enabled' }
  },
  
  disableTwoFactor: async () => {
    // Mock 2FA disable
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Two-factor authentication disabled' }
  }
}

export const usersApi = {
  getProfile: async (): Promise<any> => {
    return apiService.request('/users/profile', {
      method: 'GET'
    })
  },

  updateProfile: async (profileData: any): Promise<{ data: any }> => {
    // Mock implementation for now - in real app would call PATCH /users/profile
    console.log('Update profile request:', profileData)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
    return { data: { message: 'Profile updated successfully', profile: profileData } }
  }
}

// Orders API
export const ordersApi = {
  // Get all orders
  getAll: async (): Promise<any[]> => {
    return apiService.request('/orders', {
      method: 'GET'
    })
  },

  // Get orders by vendor
  getByVendor: async (vendorId?: string): Promise<any[]> => {
    const url = vendorId ? `/orders?vendorId=${vendorId}` : '/orders'
    return apiService.request(url, {
      method: 'GET'
    })
  },

  // Get orders by supplier
  getBySupplier: async (supplierId?: string): Promise<any[]> => {
    const url = supplierId ? `/orders?supplierId=${supplierId}` : '/orders'
    return apiService.request(url, {
      method: 'GET'
    })
  },

  // Create order
  create: async (orderData: any): Promise<any> => {
    return apiService.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  },

  // Update order
  update: async (id: string, orderData: any): Promise<any> => {
    return apiService.request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData)
    })
  },

  // Get order by ID
  getById: async (id: string): Promise<any> => {
    return apiService.request(`/orders/${id}`, {
      method: 'GET'
    })
  }
}

// Inventory API
export const inventoryApi = {
  // Get all inventory items
  getAll: async (): Promise<any> => {
    // Mock implementation - in real app would call GET /inventory
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      items: [
        {
          id: 'inv-001',
          name: 'Widget A',
          sku: 'WGT-A-001',
          quantity: 150,
          lowStockThreshold: 20,
          unitPrice: 25.99,
          category: 'Electronics',
          supplier: 'Acme Corp',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'inv-002',
          name: 'Component B',
          sku: 'CMP-B-002',
          quantity: 8,
          lowStockThreshold: 15,
          unitPrice: 45.50,
          category: 'Components',
          supplier: 'TechCorp',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'inv-003',
          name: 'Material C',
          sku: 'MAT-C-003',
          quantity: 75,
          lowStockThreshold: 25,
          unitPrice: 12.00,
          category: 'Raw Materials',
          supplier: 'MaterialCorp',
          lastUpdated: new Date().toISOString(),
        }
      ],
      totalItems: 3,
      lowStockItems: 1,
      totalValue: 4891.25
    }
  },

  // Get inventory by vendor
  getByVendor: async (vendorId?: string): Promise<any> => {
    // Mock implementation
    return this.getAll()
  },

  // Create inventory item
  create: async (itemData: any): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Inventory item created successfully', id: 'inv-' + Date.now() }
  },

  // Update inventory item
  update: async (id: string, itemData: any): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Inventory item updated successfully' }
  }
}

// Forecasting API
export const forecastingApi = {
  // Get all forecasts
  getAll: async (): Promise<any[]> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return [
      {
        id: 'forecast-001',
        itemName: 'Widget A',
        currentStock: 150,
        predictedDemand: 200,
        recommendedOrder: 75,
        forecastPeriod: '30 days',
        confidence: 85,
        createdAt: new Date().toISOString()
      },
      {
        id: 'forecast-002',
        itemName: 'Component B',
        currentStock: 8,
        predictedDemand: 50,
        recommendedOrder: 60,
        forecastPeriod: '30 days',
        confidence: 92,
        createdAt: new Date().toISOString()
      }
    ]
  },

  // Get forecasts by vendor
  getByVendor: async (vendorId?: string): Promise<any[]> => {
    return this.getAll()
  },

  // Create forecast
  create: async (forecastData: any): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { 
      success: true, 
      message: 'Forecast created successfully',
      id: 'forecast-' + Date.now(),
      forecast: forecastData
    }
  },

  // Update forecast
  update: async (id: string, forecastData: any): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Forecast updated successfully' }
  },

  // Delete forecast
  delete: async (id: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true, message: 'Forecast deleted successfully' }
  }
}

// Enhanced Payments API
export const paymentsApi = {
  // Get current subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      id: 'sub_123',
      planId: 'plan_pro',
      status: 'active',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      plan: {
        id: 'plan_pro',
        name: 'Professional',
        description: 'Advanced features for growing businesses',
        price: 49.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited vendors',
          'Advanced analytics',
          'API access',
          'Priority support'
        ]
      }
    }
  },

  // Get subscription plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return [
      {
        id: 'plan_basic',
        name: 'Basic',
        description: 'Essential features for small businesses',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Up to 5 vendors',
          'Basic analytics',
          'Email support'
        ]
      },
      {
        id: 'plan_pro',
        name: 'Professional',
        description: 'Advanced features for growing businesses',
        price: 49.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited vendors',
          'Advanced analytics',
          'API access',
          'Priority support'
        ]
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise',
        description: 'Full-featured solution for large organizations',
        price: 99.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited everything',
          'Custom integrations',
          'Dedicated support',
          'SLA guarantee'
        ]
      }
    ]
  },

  // Get payment methods
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return [
      {
        id: 'pm_123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025
        },
        isDefault: true
      }
    ]
  },

  // Add payment method
  addPaymentMethod: async (paymentMethodData: CreatePaymentMethodDto): Promise<PaymentMethod> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      id: 'pm_' + Date.now(),
      type: 'card',
      card: {
        brand: 'visa',
        last4: paymentMethodData.cardNumber.slice(-4),
        expMonth: parseInt(paymentMethodData.expiryMonth),
        expYear: parseInt(paymentMethodData.expiryYear)
      },
      isDefault: false
    }
  },

  // Update subscription
  updateSubscription: async (planId: string): Promise<Subscription> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const subscription = await this.getCurrentSubscription()
    if (subscription) {
      subscription.planId = planId
      // Update plan details based on planId
      const plans = await this.getPlans()
      const newPlan = plans.find(p => p.id === planId)
      if (newPlan) {
        subscription.plan = newPlan
      }
    }
    
    return subscription!
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<Subscription> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const subscription = await this.getCurrentSubscription()
    if (subscription) {
      subscription.cancelAtPeriodEnd = true
    }
    
    return subscription!
  },

  // Get invoices
  getInvoices: async (): Promise<Invoice[]> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return [
      {
        id: 'inv_123',
        number: 'INV-2024-001',
        status: 'paid',
        amount: 49.99,
        currency: 'USD',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        downloadUrl: '/api/invoices/inv_123/download'
      },
      {
        id: 'inv_124',
        number: 'INV-2024-002',
        status: 'paid',
        amount: 49.99,
        currency: 'USD',
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date().toISOString(),
        downloadUrl: '/api/invoices/inv_124/download'
      }
    ]
  }
}

// Export API client alias for compatibility
export const apiClient = apiService 