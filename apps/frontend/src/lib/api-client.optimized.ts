import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface RequestOptions extends AxiosRequestConfig {
  cache?: boolean;
  cacheTTL?: number;
  skipAuth?: boolean;
  retries?: number;
}

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APIClient {
  private client: AxiosInstance;
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private readonly baseURL: string;
  private readonly defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = this.getAuthToken();
        if (token && !config.headers?.skipAuth) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant ID
        const user = this.getUser();
        if (user?.tenantId) {
          config.headers['X-Tenant-ID'] = user.tenantId;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time
        const duration = Date.now() - response.config.metadata?.startTime;
        if (duration > 2000) {
          console.warn(`Slow API response: ${response.config.url} took ${duration}ms`);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error.message);
          throw new Error('Network connection failed. Please check your internet connection.');
        }

        // Handle API errors
        const apiError = new Error(
          error.response?.data?.message || 
          error.response?.data?.error ||
          `HTTP ${error.response?.status}: ${error.response?.statusText}`
        );
        
        (apiError as any).status = error.response?.status;
        (apiError as any).data = error.response?.data;

        throw apiError;
      }
    );
  }

  // Generic request method with caching and retry logic
  private async request<T>(
    config: AxiosRequestConfig,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = false,
      cacheTTL = this.defaultCacheTTL,
      retries = 3,
      ...axiosConfig
    } = options;

    const requestKey = this.generateRequestKey(config);

    // Check cache for GET requests
    if (cache && config.method?.toLowerCase() === 'get') {
      const cached = this.getFromCache<T>(requestKey);
      if (cached) {
        return cached;
      }

      // Check if request is already in progress
      if (this.requestQueue.has(requestKey)) {
        return this.requestQueue.get(requestKey);
      }
    }

    // Execute request with retry logic
    const requestPromise = this.executeWithRetry<T>(
      { ...config, ...axiosConfig },
      retries
    );

    // Add to queue for deduplication
    if (cache) {
      this.requestQueue.set(requestKey, requestPromise);
    }

    try {
      const response = await requestPromise;
      
      // Cache successful GET responses
      if (cache && config.method?.toLowerCase() === 'get') {
        this.setCache(requestKey, response, cacheTTL);
      }

      return response;
    } finally {
      // Clean up queue
      this.requestQueue.delete(requestKey);
    }
  }

  private async executeWithRetry<T>(
    config: AxiosRequestConfig,
    retries: number
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response: AxiosResponse = await this.client(config);
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx) except 408, 429
        if (
          error.response?.status >= 400 &&
          error.response?.status < 500 &&
          ![408, 429].includes(error.response?.status)
        ) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Cache management
  private generateRequestKey(config: AxiosRequestConfig): string {
    const key = `${config.method?.toUpperCase()}_${config.url}`;
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${key}_${params}`;
  }

  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: ApiResponse<T>, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Auth helpers
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || localStorage.getItem('access_token');
  }

  private getUser(): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user') || localStorage.getItem('mockUserData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    
    localStorage.setItem('authToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
  }

  private handleAuthError(): void {
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('mockUserData');

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth?mode=login';
    }
  }

  // Public API methods
  async get<T>(url: string, params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params }, options);
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.invalidateCache(url);
    return this.request<T>({ method: 'POST', url, data }, options);
  }

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.invalidateCache(url);
    return this.request<T>({ method: 'PUT', url, data }, options);
  }

  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.invalidateCache(url);
    return this.request<T>({ method: 'PATCH', url, data }, options);
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.invalidateCache(url);
    return this.request<T>({ method: 'DELETE', url }, options);
  }

  // Utility methods
  private invalidateCache(url: string): void {
    // Clear related cache entries when data is modified
    for (const key of this.cache.keys()) {
      if (key.includes(url)) {
        this.cache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', undefined, { cache: false, retries: 1 });
      return true;
    } catch {
      return false;
    }
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Specific API services
export class InventoryAPI {
  private basePath = '/inventory';

  async getAll(params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<PaginatedResponse<any>>> {
    return apiClient.get(`${this.basePath}`, params, { cache: true, cacheTTL: 300000, ...options });
  }

  async getById(id: string, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.basePath}/${id}`, undefined, { cache: true, ...options });
  }

  async create(data: any, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.basePath}`, data, options);
  }

  async update(id: string, data: any, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.patch(`${this.basePath}/${id}`, data, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.basePath}/${id}`, options);
  }

  async updateStock(
    id: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set',
    reason?: string,
    options?: RequestOptions
  ): Promise<ApiResponse<any>> {
    return apiClient.patch(`${this.basePath}/${id}/stock`, {
      quantity,
      operation,
      reason,
    }, options);
  }

  async getStats(options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.basePath}/stats`, undefined, { cache: true, cacheTTL: 300000, ...options });
  }
}

export class OrdersAPI {
  private basePath = '/orders';

  async getAll(params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<PaginatedResponse<any>>> {
    return apiClient.get(`${this.basePath}`, params, { cache: true, cacheTTL: 60000, ...options });
  }

  async getById(id: string, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.basePath}/${id}`, undefined, { cache: true, ...options });
  }

  async create(data: any, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.basePath}`, data, options);
  }

  async update(id: string, data: any, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.patch(`${this.basePath}/${id}`, data, options);
  }

  async updateStatus(id: string, status: string, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.patch(`${this.basePath}/${id}/status`, { status }, options);
  }

  async getStats(options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.basePath}/stats`, undefined, { cache: true, cacheTTL: 300000, ...options });
  }
}

export class VendorsAPI {
  private basePath = '/vendors';

  async getAll(params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<PaginatedResponse<any>>> {
    return apiClient.get(`${this.basePath}`, params, { cache: true, cacheTTL: 300000, ...options });
  }

  async getById(id: string, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.basePath}/${id}`, undefined, { cache: true, ...options });
  }

  async create(data: any, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.basePath}`, data, options);
  }

  async update(id: string, data: any, options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.patch(`${this.basePath}/${id}`, data, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.basePath}/${id}`, options);
  }
}

export class DashboardAPI {
  private basePath = '/users/admin';

  async getStats(options?: RequestOptions): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.basePath}/dashboard-stats`, undefined, { cache: true, cacheTTL: 60000, ...options });
  }

  async getActivity(limit = 10, options?: RequestOptions): Promise<ApiResponse<any[]>> {
    return apiClient.get('/activity-logs', { limit, sort: 'createdAt:desc' }, { cache: true, cacheTTL: 30000, ...options });
  }
}

// Export API instances
export const inventoryApi = new InventoryAPI();
export const ordersApi = new OrdersAPI();
export const vendorsApi = new VendorsAPI();
export const dashboardApi = new DashboardAPI();

export default apiClient; 