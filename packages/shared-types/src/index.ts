// Shared types and interfaces for VendorFlow

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'vendor' | 'supplier';
  status: 'active' | 'pending' | 'suspended';
  companyName?: string;
  tenantId: string;
}

// Order types
export interface Order {
  id: string;
  orderId: string;
  vendorId: string;
  supplierId: string;
  tenantId: string;
  status: 'placed' | 'confirmed' | 'dispatched' | 'arrived' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  orderDate: Date;
  expectedArrivalDate?: Date;
}

export interface OrderItem {
  id: string;
  inventoryId: string;
  stockName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// Vendor types
export interface Vendor {
  id: string;
  name: string;
  vendorCode: string;
  status: 'active' | 'inactive' | 'pending';
  category: string;
  tenantId: string;
  contactInfo: ContactInfo;
}

// Supplier types
export interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  tenantId: string;
  contactInfo: ContactInfo;
}

// Common types
export interface ContactInfo {
  email: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  vendorProfile?: string;
  iat?: number;
  exp?: number;
} 