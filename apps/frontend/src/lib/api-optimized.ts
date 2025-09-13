// Optimized API Service with reduced logging
class OptimizedApiService {
  private static instance: OptimizedApiService;
  private accessToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshPromise: Promise<void> | null = null;
  private lastTokenCheck = 0;
  private readonly TOKEN_CHECK_INTERVAL = 30000; // Check token max once per 30 seconds

  static getInstance(): OptimizedApiService {
    if (!OptimizedApiService.instance) {
      OptimizedApiService.instance = new OptimizedApiService();
    }
    return OptimizedApiService.instance;
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiryTime) return true;
    
    // Use a 5 minute buffer to be more forgiving
    const isExpired = Date.now() >= this.tokenExpiryTime - 300000;
    
    // Only log significant events
    if (isExpired && Date.now() - this.lastTokenCheck > this.TOKEN_CHECK_INTERVAL) {
      console.log('Token expired, refresh needed');
      this.lastTokenCheck = Date.now();
    }
    
    return isExpired;
  }

  private async ensureValidToken(): Promise<void> {
    // Rate limit token checks to reduce noise
    const now = Date.now();
    if (now - this.lastTokenCheck < 1000) { // Don't check more than once per second
      return;
    }
    
    this.lastTokenCheck = now;

    // If we don't have a token at all, redirect to login
    if (!this.accessToken) {
      this.initializeFromStorage();
      if (!this.accessToken) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
    }

    // If token is expired, try to refresh
    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  }

  private initializeFromStorage(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (token) {
      this.accessToken = token;
      this.tokenExpiryTime = expiry ? parseInt(expiry) : null;
    }
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
    // Token refresh implementation here...
    // For now, just redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.ensureValidToken();
    
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api'}/${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken && !endpoint.includes('auth/login') && !endpoint.includes('auth/register')) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok && response.status === 401 && !endpoint.includes('auth/')) {
      await this.refreshToken();
      // Retry with new token
      const retryHeaders = { ...headers };
      if (this.accessToken) {
        (retryHeaders as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
      }
      
      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
      
      return retryResponse.json();
    }

    return response.json();
  }
}

// Export optimized instance
export const optimizedApi = OptimizedApiService.getInstance(); 