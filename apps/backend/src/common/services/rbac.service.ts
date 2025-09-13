import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from '../../modules/users/schemas/user.schema';

export interface UserContext {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  vendorProfile?: string;
  supplierId?: string;
}

@Injectable()
export class RBACService {
  /**
   * Build MongoDB filter for orders based on user role
   */
  buildOrderFilter(user: UserContext, additionalFilters: any = {}): any {
    const baseFilter = {
      ...additionalFilters,
      // Always filter by tenant for multi-tenant isolation
      tenantId: new Types.ObjectId(user.tenantId),
    };

    switch (user.role) {
      case UserRole.ADMIN:
        // Admins can see all orders within their tenant
        return baseFilter;

      case UserRole.VENDOR:
        // Vendors can only see orders assigned to their vendor profile
        if (!user.vendorProfile) {
          throw new Error('Vendor user must have a vendorProfile');
        }
        return {
          ...baseFilter,
          vendorId: new Types.ObjectId(user.vendorProfile),
        };

      case UserRole.SUPPLIER:
        // Suppliers can only see orders assigned to them
        return {
          ...baseFilter,
          supplierId: new Types.ObjectId(user.sub), // User ID is the supplier ID
        };

      default:
        throw new Error(`Unsupported user role: ${user.role}`);
    }
  }

  /**
   * Build MongoDB filter for vendors based on user role
   */
  buildVendorFilter(user: UserContext, additionalFilters: any = {}): any {
    const baseFilter = {
      ...additionalFilters,
      tenantId: new Types.ObjectId(user.tenantId),
    };

    switch (user.role) {
      case UserRole.ADMIN:
        // Admins can see all vendors within their tenant
        return baseFilter;

      case UserRole.VENDOR:
        // Vendors can only see their own profile
        if (!user.vendorProfile) {
          throw new Error('Vendor user must have a vendorProfile');
        }
        return {
          ...baseFilter,
          _id: new Types.ObjectId(user.vendorProfile),
        };

      case UserRole.SUPPLIER:
        // Suppliers can see vendors they are associated with
        return {
          ...baseFilter,
          // This will be populated based on supplier-vendor relationships
          _id: { $in: [] }, // Will be populated by service logic
        };

      default:
        throw new Error(`Unsupported user role: ${user.role}`);
    }
  }

  /**
   * Build MongoDB filter for suppliers based on user role
   */
  buildSupplierFilter(user: UserContext, additionalFilters: any = {}): any {
    const baseFilter = {
      ...additionalFilters,
      tenantId: new Types.ObjectId(user.tenantId),
    };

    switch (user.role) {
      case UserRole.ADMIN:
        // Admins can see all suppliers within their tenant
        return baseFilter;

      case UserRole.VENDOR:
        // Vendors can see suppliers they work with
        if (!user.vendorProfile) {
          throw new Error('Vendor user must have a vendorProfile');
        }
        return {
          ...baseFilter,
          vendors: new Types.ObjectId(user.vendorProfile),
        };

      case UserRole.SUPPLIER:
        // Suppliers can only see their own profile
        return {
          ...baseFilter,
          _id: new Types.ObjectId(user.sub), // User ID is the supplier ID
        };

      default:
        throw new Error(`Unsupported user role: ${user.role}`);
    }
  }

  /**
   * Build MongoDB filter for inventory based on user role
   */
  buildInventoryFilter(user: UserContext, additionalFilters: any = {}): any {
    const baseFilter = {
      ...additionalFilters,
      tenantId: new Types.ObjectId(user.tenantId),
    };

    switch (user.role) {
      case UserRole.ADMIN:
        // Admins can see all inventory within their tenant
        return baseFilter;

      case UserRole.VENDOR:
        // Vendors can see inventory they manage
        if (!user.vendorProfile) {
          throw new Error('Vendor user must have a vendorProfile');
        }
        return {
          ...baseFilter,
          vendorId: new Types.ObjectId(user.vendorProfile),
        };

      case UserRole.SUPPLIER:
        // Suppliers can see inventory they supply
        return {
          ...baseFilter,
          'suppliers.supplierId': new Types.ObjectId(user.sub),
        };

      default:
        throw new Error(`Unsupported user role: ${user.role}`);
    }
  }

  /**
   * Check if user can access a specific resource
   */
  canAccessResource(user: UserContext, resourceOwnerId: string, resourceType: 'order' | 'vendor' | 'supplier'): boolean {
    switch (user.role) {
      case UserRole.ADMIN:
        return true; // Admins can access all resources in their tenant

      case UserRole.VENDOR:
        if (resourceType === 'vendor') {
          return user.vendorProfile === resourceOwnerId;
        }
        if (resourceType === 'order') {
          // Will be validated by checking if order.vendorId matches user.vendorProfile
          return true; // Let the service handle the detailed check
        }
        return false;

      case UserRole.SUPPLIER:
        if (resourceType === 'supplier') {
          return user.sub === resourceOwnerId;
        }
        if (resourceType === 'order') {
          // Will be validated by checking if order.supplierId matches user.sub
          return true; // Let the service handle the detailed check
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Validate that a user can create a resource with specific ownership
   */
  canCreateResource(user: UserContext, resourceData: any, resourceType: 'order' | 'vendor' | 'supplier'): boolean {
    switch (user.role) {
      case UserRole.ADMIN:
        return true; // Admins can create any resource in their tenant

      case UserRole.VENDOR:
        if (resourceType === 'order') {
          // Vendors can only create orders for their own vendor profile
          return resourceData.vendorId === user.vendorProfile;
        }
        return false;

      case UserRole.SUPPLIER:
        if (resourceType === 'order') {
          // Suppliers can only create orders assigned to themselves
          return resourceData.supplierId === user.sub;
        }
        return false;

      default:
        return false;
    }
  }
} 