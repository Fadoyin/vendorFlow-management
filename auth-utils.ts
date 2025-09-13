// Authentication utilities for VendorFlow

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'vendor' | 'supplier';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Token management
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
};

// User data management
export const getUserData = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

export const setUserData = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_data', JSON.stringify(user));
};

// Authentication status
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Role-based access control
export const hasRole = (requiredRole: string | string[], userRole?: string): boolean => {
  if (!userRole) {
    const user = getUserData();
    userRole = user?.role;
  }
  
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
};

export const isAdmin = (userRole?: string): boolean => {
  return hasRole('admin', userRole);
};

export const isVendor = (userRole?: string): boolean => {
  return hasRole('vendor', userRole);
};

export const isSupplier = (userRole?: string): boolean => {
  return hasRole('supplier', userRole);
};

// Dashboard redirect logic
export const redirectToDashboard = (userRole?: string): string => {
  if (!userRole) {
    const user = getUserData();
    userRole = user?.role;
  }

  switch (userRole) {
    case 'admin':
      return '/dashboard';
    case 'vendor':
      return '/dashboard/vendor';
    case 'supplier':
      return '/dashboard/supplier';
    default:
      return '/dashboard';
  }
};

// Route protection
export const getProtectedRoute = (route: string, userRole?: string): string => {
  if (!isAuthenticated()) {
    return '/auth?mode=login&redirect=' + encodeURIComponent(route);
  }
  
  return route;
};

// Login redirect logic
export const getLoginRedirect = (): string => {
  if (typeof window === 'undefined') return '/dashboard';
  
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');
  
  if (redirect) {
    return decodeURIComponent(redirect);
  }
  
  const user = getUserData();
  return redirectToDashboard(user?.role);
};

// Logout functionality
export const logout = (): void => {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/auth?mode=login';
  }
};

// Token validation
export const isTokenExpired = (token?: string): boolean => {
  if (!token) {
    token = getAuthToken();
  }
  
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Auto-logout on token expiration
export const checkTokenExpiration = (): void => {
  if (isTokenExpired()) {
    logout();
  }
};

// Role-based navigation items
export const getNavigationItems = (userRole?: string) => {
  if (!userRole) {
    const user = getUserData();
    userRole = user?.role;
  }

  const commonItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  ];

  const roleBasedItems = {
    admin: [
      ...commonItems,
      { name: 'Users', href: '/dashboard/users', icon: 'users' },
      { name: 'Vendors', href: '/dashboard/vendors', icon: 'vendors' },
      { name: 'Suppliers', href: '/dashboard/suppliers', icon: 'suppliers' },
      { name: 'Orders', href: '/dashboard/orders', icon: 'orders' },
      { name: 'Inventory', href: '/dashboard/inventory', icon: 'inventory' },
      { name: 'Payments', href: '/dashboard/payments', icon: 'payments' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: 'analytics' },
      { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
    ],
    vendor: [
      ...commonItems,
      { name: 'Profile', href: '/dashboard/vendor/profile', icon: 'profile' },
      { name: 'Orders', href: '/dashboard/vendor/orders', icon: 'orders' },
      { name: 'Inventory', href: '/dashboard/vendor/inventory', icon: 'inventory' },
      { name: 'Payments', href: '/dashboard/vendor/payments', icon: 'payments' },
      { name: 'Forecasting', href: '/dashboard/vendor/forecasting', icon: 'forecasting' },
    ],
    supplier: [
      ...commonItems,
      { name: 'Profile', href: '/dashboard/supplier/profile', icon: 'profile' },
      { name: 'Orders', href: '/dashboard/supplier/orders', icon: 'orders' },
    ],
  };

  return roleBasedItems[userRole] || commonItems;
};
