// Central API service for VendorFlow frontend
// Handles authentication, request/response management, and security

import { User, UserRole } from '@/types';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  refresh_token?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: UserRole;
  inviteCode?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Ensure we don't double-add /api if it's already in the URL
    this.baseURL = baseUrl.endsWith('/api') ? baseUrl : baseUrl + '/api';
    
    // Initialize token from storage on client side only
    if (typeof window !== 'undefined') {
      this.initializeFromStorage();
    }
  }

  private initializeFromStorage(): void {
    try {
      const token = localStorage.getItem('authToken');
      const expiryTime = localStorage.getItem('tokenExpiry');
      
      if (token && expiryTime) {
        this.accessToken = token;
        this.tokenExpiryTime = parseInt(expiryTime, 10);
      }
    } catch (error) {
      console.warn('Failed to load auth state from storage:', error);
    }
  }

  private setTokens(accessToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.tokenExpiryTime = Date.now() + (expiresIn * 1000);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('tokenExpiry', this.tokenExpiryTime.toString());
      } catch (error) {
        console.warn('Failed to save auth state to storage:', error);
      }
    }
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.tokenExpiryTime = null;
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('userData');
      } catch (error) {
        console.warn('Failed to clear auth state from storage:', error);
      }
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiryTime) return true;
    // Use a 5 minute buffer to be more forgiving
    const isExpired = Date.now() >= this.tokenExpiryTime - 300000;
    // Only log if token is actually expired to reduce noise
    if (isExpired) {
      console.log('Token expired, refresh needed');
    }
    return isExpired;
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    try {
      console.log('Attempting token refresh...');
      
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access_token, data.expires_in);
        console.log('Token refresh successful');
      } else {
        console.warn('Token refresh failed, clearing tokens');
        this.clearTokens();
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.warn('Token refresh error:', error);
      this.clearTokens();
      // Redirect to login on refresh error
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    // Add debugging
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      const storedExpiry = localStorage.getItem('tokenExpiry');
      console.log('Token check:', {
        hasStoredToken: !!storedToken,
        hasAccessToken: !!this.accessToken,
        storedExpiry,
        currentTime: Date.now(),
        isExpired: this.isTokenExpired()
      });
    }

    // If we don't have a token at all, redirect to login
    if (!this.accessToken) {
      this.initializeFromStorage();
      if (!this.accessToken) {
        console.log('No token available, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
    }

    // If token is expired, try to refresh
    if (this.isTokenExpired()) {
      console.log('Token expired, attempting refresh');
      try {
        await this.refreshToken();
      } catch (error) {
        console.log('Token refresh failed, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
    }
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Ensure endpoint doesn't start with slash to avoid path conflicts
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const url = `${this.baseURL}/${cleanEndpoint}`;
      


      // Ensure valid token for non-auth endpoints
      if (!endpoint.includes('auth/login') && !endpoint.includes('auth/register')) {
        await this.ensureValidToken();
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.accessToken && !endpoint.includes('auth/login') && !endpoint.includes('auth/register')) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        console.log('Adding auth header for:', endpoint);
      } else {
        console.log('No auth token available for:', endpoint);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        throw new Error(`Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
      }

      // Handle token expiry with retry
      if (response.status === 401 && !endpoint.includes('auth/')) {
        console.log('Got 401, attempting token refresh and retry');
        try {
          await this.refreshToken();
          // Retry the request with new token
          const retryHeaders: Record<string, string> = { ...headers as Record<string, string> };
          if (this.accessToken) {
            retryHeaders['Authorization'] = `Bearer ${this.accessToken}`;
          }
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
          
          if (retryResponse.ok) {
            const contentType = retryResponse.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
              data = await retryResponse.json();
            } else {
              data = await retryResponse.text();
            }
            return { data };
          } else {
            // If retry still fails, handle as usual
            let retryData;
            const contentType = retryResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              retryData = await retryResponse.json();
            } else {
              retryData = await retryResponse.text();
            }
            return {
              error: retryData?.message || retryData?.error || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`
            };
          }
        } catch (refreshError) {
          console.log('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return {
            error: 'Authentication failed'
          };
        }
      }

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          error: data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return { data };

    } catch (error: any) {
      console.error('API Request failed:', error);
      
      if (error.name === 'AbortError') {
        return { error: 'Request was cancelled' };
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return { error: 'Network error - unable to connect to server' };
      }

      return { 
        error: error.message || 'An unexpected error occurred' 
      };
    }
  }

  // Authentication methods
  public async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.access_token) {
      this.setTokens(response.data.access_token, response.data.expires_in);
      
      // Store user data
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        } catch (error) {
          console.warn('Failed to save user data:', error);
        }
      }
    }

    return response;
  }

  public async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data?.access_token) {
      this.setTokens(response.data.access_token, response.data.expires_in);
      
      // Store user data
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        } catch (error) {
          console.warn('Failed to save user data:', error);
        }
      }
    }

    return response;
  }

  public async logout(): Promise<ApiResponse> {
    const response = await this.request('auth/logout', {
      method: 'POST',
    });
    
    this.clearTokens();
    
    return response;
  }

  public async sendOtp(email: string, purpose: 'signup' | 'login'): Promise<ApiResponse<{ message: string; expiresIn: number }>> {
    return this.request<{ message: string; expiresIn: number }>('auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  }

  public async verifyOtp(email: string, otp: string, purpose: 'signup' | 'login'): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    });

    if (response.data?.access_token) {
      this.setTokens(response.data.access_token, response.data.expires_in);
      
      // Store user data
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        } catch (error) {
          console.warn('Failed to save user data:', error);
        }
      }
    }

    return response;
  }

  public async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  public async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("users/profile/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // OTP-related methods
  public async sendOtp(email: string, purpose: 'signup' | 'login'): Promise<ApiResponse<{ message: string; expiresIn: number }>> {
    return this.request('auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  }

  public async verifyOtp(email: string, otp: string, purpose: 'signup' | 'login'): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    });

    if (response.data?.access_token) {
      this.setTokens(response.data.access_token, response.data.expires_in);
      
      // Store user data
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        } catch (error) {
          console.warn('Failed to save user data:', error);
        }
      }
    }

    return response;
  }

  public async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  public async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  public async validatePassword(password: string): Promise<PasswordValidation> {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    
    if (errors.length === 0) {
      if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        strength = 'strong';
      } else {
        strength = 'medium';
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  public getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get user data:', error);
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return this.accessToken !== null && !this.isTokenExpired();
  }
}

// Create singleton instance
const apiService = new ApiService();

// Analytics API
export const analyticsApi = {
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('analytics/dashboard-stats');
  },

  getKPIReport: async (): Promise<ApiResponse<any>> => {
    return apiService.request('analytics/kpi-report');
  },

  getOrderStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('analytics/orders');
  },

  getVendorStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('analytics/vendors');
  },

  getSupplierStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('analytics/suppliers');
  },

  getInventoryStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('analytics/inventory');
  }
};

// Users API
export const usersApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiService.request('users/profile');
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiService.request('users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAll: async (params?: any): Promise<ApiResponse<User[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`users${queryString}`);
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    return apiService.request(`users/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<User>> => {
    return apiService.request('users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<User>> => {
    return apiService.request(`users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`users/${id}`, {
      method: 'DELETE',
    });
  }
};

// Orders API
export const ordersApi = {
  getAll: async (params?: any): Promise<ApiResponse<any[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`orders${queryString}`);
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`orders/${id}`);
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('orders/stats');
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiService.request(`orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<any>> => {
    return apiService.request(`orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`orders/${id}`, {
      method: 'DELETE',
    });
  }
};

// Inventory API
export const inventoryApi = {
  getAll: async (params?: any): Promise<ApiResponse<any[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`inventory${queryString}`);
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`inventory/${id}`);
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('inventory/stats');
  },

  getLowStock: async (): Promise<ApiResponse<any[]>> => {
    return apiService.request('inventory/low-stock');
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiService.request(`inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`inventory/${id}`, {
      method: 'DELETE',
    });
  },

  updateStock: async (id: string, quantity: number, type: 'add' | 'remove' | 'set'): Promise<ApiResponse<any>> => {
    return apiService.request(`inventory/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, type }),
    });
  },

  export: async (): Promise<ApiResponse<any>> => {
    return apiService.request('inventory/export');
  }
};

// Vendors API
export const vendorsApi = {
  getAll: async (params?: any): Promise<ApiResponse<any[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`vendors${queryString}`);
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`vendors/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiService.request(`vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`vendors/${id}`, {
      method: 'DELETE',
    });
  }
};

// Suppliers API
export const suppliersApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`suppliers${queryString}`);
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`suppliers/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiService.request(`suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`suppliers/${id}`, {
      method: 'DELETE',
    });
  },

  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request("suppliers/dashboard/stats");
  },
};

// Payments API
export const paymentsApi = {
  getAll: async (params?: any): Promise<ApiResponse<any[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`payments${queryString}`);
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/${id}`);
  },

  getAllTransactions: async (params?: any): Promise<ApiResponse<any[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`payments/transactions${queryString}`);
  },

  getUsageStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('payments/usage-stats');
  },

  createSubscription: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  processPayment: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('payments/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Stripe-specific methods
  createSetupIntent: async (): Promise<ApiResponse<any>> => {
    return apiService.request('payments/setup-intent', {
      method: 'POST',
    });
  },

  addPaymentMethod: async (data: { payment_method_id: string }): Promise<ApiResponse<any>> => {
    return apiService.request('payments/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPaymentMethods: async (): Promise<ApiResponse<any[]>> => {
    return apiService.request('payments/payment-methods');
  },

  removePaymentMethod: async (paymentMethodId: string): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
    });
  },

  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/payment-methods/${paymentMethodId}/set-default`, {
      method: 'POST',
    });
  },

  getSubscription: async (): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription');
  },

  cancelSubscription: async (): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription/cancel', {
      method: 'POST',
    });
  },

  // NEW: Create Stripe checkout session
  createCheckoutSession: async (planId: string, billingPeriod: 'monthly' | 'yearly'): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ planId, billingPeriod }),
    });
  },

  // Get current subscription details
  getCurrentSubscription: async (): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription');
  },

  updateSubscription: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  reactivateSubscription: async (): Promise<ApiResponse<any>> => {
    return apiService.request('payments/subscription/reactivate', {
      method: 'POST',
    });
  },

  getPlans: async (): Promise<ApiResponse<any[]>> => {
    return apiService.request('payments/plans');
  },

  getInvoices: async (params?: any): Promise<ApiResponse<any[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiService.request(`payments/invoices${queryString}`);
  },

  getInvoice: async (invoiceId: string): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/invoices/${invoiceId}`);
  },

  downloadInvoice: async (invoiceId: string): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/invoices/${invoiceId}/download`);
  },

  createTransaction: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('payments/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // NEW: Real Stripe payment creation
  createRealStripePayment: async (data: { amount: number; currency?: string; description?: string }): Promise<ApiResponse<any>> => {
    return apiService.request('payments/stripe-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // NEW: Sync payment with Stripe
  syncPaymentWithStripe: async (transactionId: string): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/sync/${transactionId}`, {
      method: 'POST',
    });
  },

  // NEW: Get real Stripe transactions
  getRealStripeTransactions: async (limit?: number): Promise<ApiResponse<any[]>> => {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiService.request(`payments/stripe-transactions${queryString}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiService.request(`payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`payments/${id}`, {
      method: 'DELETE',
    });
  }
};

// Forecasting API
export const forecastingApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return apiService.request('forecasting');
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`forecasting/${id}`);
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    return apiService.request('forecasting/stats');
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('forecasting', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiService.request(`forecasting/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiService.request(`forecasting/${id}`, {
      method: 'DELETE',
    });
  },

  // Enhanced Forecasting Methods
  generateCostForecast: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('forecasts/cost-forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateInventoryForecast: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('forecasts/inventory-forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateDemandForecast: async (data: any): Promise<ApiResponse<any>> => {
    return apiService.request('forecasts/demand-forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCostForecast: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`forecasts/cost-forecast/${id}`);
  },

  getInventoryForecast: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`forecasts/inventory-forecast/${id}`);
  },

  getDemandForecast: async (id: string): Promise<ApiResponse<any>> => {
    return apiService.request(`forecasts/demand-forecast/${id}`);
  },
};

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Determine strength
  const criteriaMet = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ].filter(Boolean).length;

  if (criteriaMet >= 5 && password.length >= 12) {
    strength = 'strong';
  } else if (criteriaMet >= 3 && password.length >= 8) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

// Add OTP methods to the ApiService class
ApiService.prototype.sendOtp = async function(email: string, purpose: 'signup' | 'login') {
  return this.request('auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
  });
};

ApiService.prototype.verifyOtp = async function(email: string, otp: string, purpose: 'signup' | 'login') {
  const response = await this.request('auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp, purpose }),
  });

  if (response.data?.access_token) {
    this.setTokens(response.data.access_token, response.data.expires_in);
    
    // Store user data
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      } catch (error) {
        console.warn('Failed to save user data:', error);
      }
    }
  }

  return response;
};

// Export auth functions

export const authApi = {
  login: async (credentials) => {
    return apiService.request('auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return apiService.request('auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  sendOtp: async (email, purpose) => {
    return apiService.request('auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  },

  verifyOtp: async (email, otp, purpose) => {
    return apiService.request('auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    });
  },

  forgotPassword: async (email) => {
    return apiService.forgotPassword(email);
  },

  resetPassword: async (token, newPassword) => {
    return apiService.resetPassword(token, newPassword);
  },

  logout: () => {
    apiService.clearTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData');
    }
  },

  getCurrentUser: () => apiService.getCurrentUser(),
  isAuthenticated: () => apiService.isAuthenticated()
};
export { apiService };
export default apiService;

// OTP Methods Extension
declare module './api' {
  interface ApiService {
    sendOtp(email: string, purpose: 'signup' | 'login'): Promise<ApiResponse<{ message: string; expiresIn: number }>>;
    verifyOtp(email: string, otp: string, purpose: 'signup' | 'login'): Promise<ApiResponse<AuthResponse>>;
  }
}

// Add the methods to the apiService prototype
Object.assign(ApiService.prototype, {
  async sendOtp(email: string, purpose: 'signup' | 'login') {
    return this.request('auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  },

  async verifyOtp(email: string, otp: string, purpose: 'signup' | 'login') {
    return this.request('auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    });
  },
});

// Utility function to get fresh token
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// Vendor Dashboard API
export const vendorApi = {
  getDashboard: async (): Promise<ApiResponse<any>> => {
    return apiService.request('vendors/dashboard');
  },

  getOrders: async (params: any = {}): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key].toString());
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `vendors/orders?${queryString}` : 'vendors/orders';
    
    return apiService.request(url);
  },

  getForecast: async (params: { period?: string; metric?: string } = {}): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams();
    
    if (params.period) searchParams.append('period', params.period);
    if (params.metric) searchParams.append('metric', params.metric);

    const queryString = searchParams.toString();
    const url = queryString ? `vendors/forecast?${queryString}` : 'vendors/forecast';
    
    return apiService.request(url);
  },

  generateForecast: async (params: { period?: string } = {}): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams();
    
    if (params.period) searchParams.append('period', params.period);

    const queryString = searchParams.toString();
    const url = queryString ? `vendors/forecast/generate?${queryString}` : 'vendors/forecast/generate';
    
    return apiService.request(url, { method: 'POST' });
  },

  // Vendor Payments API
  getPayments: async (): Promise<ApiResponse<any>> => {
    return apiService.request('vendors/payments');
  },

  getPaymentTransactions: async (params: { page?: number; limit?: number; status?: string } = {}): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    const url = queryString ? `vendors/payments/transactions?${queryString}` : 'vendors/payments/transactions';
    
    return apiService.request(url);
  },
};

// Search API
export const searchApi = {
  // Global search across all entities
  global: async (query: string, filters: any = {}) => {
    const params = new URLSearchParams({
      q: query,
      ...filters,
    });
    return apiService.request(`search?${params.toString()}`);
  },

  // Search specific entity
  searchOrders: async (query: string, limit: number = 10) => {
    return apiService.request(`orders?search=${encodeURIComponent(query)}&limit=${limit}`);
  },

  searchInventory: async (query: string, limit: number = 10) => {
    return apiService.request(`inventory/search?term=${encodeURIComponent(query)}&limit=${limit}`);
  },

  searchSuppliers: async (query: string) => {
    return apiService.request(`suppliers/search?q=${encodeURIComponent(query)}`);
  },

  searchVendors: async (query: string, limit: number = 10) => {
    return apiService.request(`vendors?search=${encodeURIComponent(query)}&limit=${limit}`);
  },
};
