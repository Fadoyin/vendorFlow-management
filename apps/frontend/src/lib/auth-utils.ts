// Authentication utilities
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'vendor' | 'supplier';
  companyName?: string;
  tenantId?: string;
  status?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  const user = getStoredUser();
  
  return !!(token && user && user.id);
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try new format first
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.id) return user;
    }
    
    // Fallback to legacy format
    const mockUserData = localStorage.getItem('mockUserData');
    if (mockUserData) {
      const user = JSON.parse(mockUserData);
      if (user && user.id) return user;
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  return null;
}

/**
 * Store user data
 */
export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('mockUserData', JSON.stringify(user)); // Legacy support
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('access_token') || localStorage.getItem('authToken');
}

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('access_token', token);
  localStorage.setItem('authToken', token); // Legacy support
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  // Clear all auth-related items
  const authKeys = [
    'access_token',
    'authToken',
    'refresh_token',
    'refreshToken',
    'user',
    'userData',
    'mockUserData'
  ];
  
  authKeys.forEach(key => localStorage.removeItem(key));
}

/**
 * Redirect user to their appropriate dashboard based on role
 */
export function redirectToDashboard(user: User): void {
  if (typeof window === 'undefined') return;
  
  const role = user?.role?.toLowerCase();
  
  switch (role) {
    case 'admin':
      window.location.href = '/dashboard';
      break;
    case 'vendor':
      window.location.href = '/dashboard/vendor';
      break;
    case 'supplier':
      window.location.href = '/dashboard/supplier';
      break;
    default:
      console.warn('Unknown user role:', role);
      window.location.href = '/dashboard';
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, requiredRoles: string[]): boolean {
  if (!user || !user.role) return false;
  
  return requiredRoles.some(role => 
    role.toLowerCase() === user.role.toLowerCase()
  );
}

/**
 * Get dashboard path for user role
 */
export function getDashboardPath(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return '/dashboard';
    case 'vendor':
      return '/dashboard/vendor';
    case 'supplier':
      return '/dashboard/supplier';
    default:
      return '/dashboard';
  }
}

/**
 * Check if current path is allowed for user role
 */
export function isPathAllowedForRole(path: string, role: string): boolean {
  const normalizedPath = path.toLowerCase();
  const normalizedRole = role.toLowerCase();
  
  // Admin can access everything
  if (normalizedRole === 'admin') {
    return true;
  }
  
  // Check role-specific paths
  if (normalizedRole === 'vendor') {
    return normalizedPath.startsWith('/dashboard/vendor') || 
           normalizedPath === '/dashboard' ||
           normalizedPath.startsWith('/auth') ||
           normalizedPath === '/';
  }
  
  if (normalizedRole === 'supplier') {
    return normalizedPath.startsWith('/dashboard/supplier') || 
           normalizedPath === '/dashboard' ||
           normalizedPath.startsWith('/auth') ||
           normalizedPath === '/';
  }
  
  return false;
}

/**
 * Validate and redirect if path is not allowed for user role
 */
export function validateAndRedirectPath(currentPath: string): void {
  const user = getStoredUser();
  
  if (!user) {
    // Not authenticated, redirect to login
    if (currentPath !== '/auth' && !currentPath.startsWith('/auth')) {
      window.location.href = '/auth?mode=login';
    }
    return;
  }
  
  if (!isPathAllowedForRole(currentPath, user.role)) {
    // Path not allowed for this role, redirect to appropriate dashboard
    redirectToDashboard(user);
  }
}

/**
 * Setup authentication state listener
 */
export function setupAuthListener(): void {
  if (typeof window === 'undefined') return;
  
  // Listen for storage changes (e.g., logout in another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'user' || e.key === 'access_token') {
      // Auth state changed, validate current path
      setTimeout(() => {
        validateAndRedirectPath(window.location.pathname);
      }, 100);
    }
  });
  
  // Validate current path on initial load
  setTimeout(() => {
    validateAndRedirectPath(window.location.pathname);
  }, 100);
}

/**
 * Logout user and redirect
 */
export function logout(): void {
  clearAuth();
  window.location.href = '/auth?mode=login';
}

/**
 * Check if token is expired (basic check)
 */
export function isTokenExpired(): boolean {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    // Simple JWT payload extraction (not for security, just UX)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
}

/**
 * Refresh authentication token
 */
export async function refreshAuthToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    if (data.access_token) {
      setAuthToken(data.access_token);
      
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

/**
 * Setup automatic token refresh
 */
export function setupTokenRefresh(): void {
  if (typeof window === 'undefined') return;
  
  // Check token expiry every 5 minutes
  setInterval(async () => {
    if (isAuthenticated() && isTokenExpired()) {
      const refreshed = await refreshAuthToken();
      
      if (!refreshed) {
        // Refresh failed, logout user
        logout();
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Legacy exports for backward compatibility
export const getUserFromStorage = getStoredUser; 