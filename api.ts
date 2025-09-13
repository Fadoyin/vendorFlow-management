// API Service for VendorFlow
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        headers: defaultHeaders,
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'An error occurred' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    localStorage.removeItem('auth_token');
    return { data: { success: true } };
  }

  // User endpoints
  async getCurrentUser() {
    return this.request('/users/me');
  }

  // Dashboard endpoints
  async getDashboardData() {
    return this.request('/analytics/dashboard');
  }

  // Vendors endpoints
  async getVendors() {
    return this.request('/vendors');
  }

  async createVendor(vendorData: any) {
    return this.request('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  }

  // Suppliers endpoints
  async getSuppliers() {
    return this.request('/suppliers');
  }

  async createSupplier(supplierData: any) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  }

  // Orders endpoints
  async getOrders() {
    return this.request('/orders');
  }

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Inventory endpoints
  async getInventory() {
    return this.request('/inventory');
  }

  async updateInventory(id: string, inventoryData: any) {
    return this.request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(inventoryData),
    });
  }

  // Payments endpoints
  async getPayments() {
    return this.request('/payments/transactions');
  }

  async createPayment(paymentData: any) {
    return this.request('/payments/transactions', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Forecasting endpoints
  async getForecast() {
    return this.request('/forecasts');
  }

  async generateForecast(forecastData: any) {
    return this.request('/forecasts', {
      method: 'POST',
      body: JSON.stringify(forecastData),
    });
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }
}

const apiService = new ApiService();
export default apiService;
