import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const BYPASS_TENANT_KEY = 'bypassTenant';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const bypassTenant = this.reflector.getAllAndOverride<boolean>(BYPASS_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (bypassTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('User has no tenant association');
    }

    // Add tenantId to request for use in services
    request.tenantId = user.tenantId;
    request.userRole = user.role;
    request.userId = user.sub;

    return true;
  }
}

export const BypassTenant = () => {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(BYPASS_TENANT_KEY, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(BYPASS_TENANT_KEY, true, target);
    return target;
  };
}; 