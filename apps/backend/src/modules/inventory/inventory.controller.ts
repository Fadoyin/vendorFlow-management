import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from '../../common/schemas/item.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UserRole } from '../../common/schemas/user.schema';
import { RBACService } from '../../common/services/rbac.service';
import { Types } from 'mongoose';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly rbacService: RBACService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: Item,
  })
  async create(
    @Body() createItemDto: CreateItemDto,
    @Request() req: any,
  ): Promise<Item> {
    const tenantId = req.tenantId || req.user?.tenantId;
    const userId = req.userId || req.user?.sub;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }
    
    // Build user context with all necessary fields
    const user = {
      sub: userId,
      role: req.userRole || req.user?.role,
      tenantId: tenantId,
      vendorProfile: req.vendorProfile,
      supplierProfile: req.supplierProfile,
      email: req.user?.email,
    };
    
    return this.inventoryService.create(createItemDto, tenantId, userId, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({
    status: 200,
    description: 'List of items retrieved successfully',
    type: [Item],
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(
    @Query() query: any,
    @Request() req: any,
  ): Promise<{ items: Item[]; total: number; stats?: any }> {
    const user = {
      sub: req.userId,
      email: req.user?.email,
      role: req.userRole,
      tenantId: req.tenantId,
      vendorProfile: req.vendorProfile,
      supplierProfile: req.supplierProfile,
    };
    
    if (!user.tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }

    // SECURITY: Log inventory access for audit trail
    this.logger.log(`Inventory access by ${user.role} user ${user.email} for tenant ${user.tenantId}`);

    // Use RBAC service for proper tenant isolation
    // Admins see all inventory WITHIN THEIR TENANT ONLY, not across all tenants
    const inventoryFilter = this.rbacService.buildInventoryFilter(user);
    
    return this.inventoryService.findAllWithFilter(inventoryFilter, query);
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get inventory items by supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier inventory retrieved successfully',
    type: [Item],
  })
  async getSupplierInventory(
    @Param('supplierId') supplierId: string,
    @Query() query: any,
    @Request() req: any,
  ): Promise<{ items: Item[]; total: number }> {
    const user = req.user;
    const tenantId = user?.tenantId;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }

    // Build filter for supplier's inventory within the same tenant
    const supplierFilter = {
      tenantId: new Types.ObjectId(tenantId),
      'suppliers.supplierId': new Types.ObjectId(supplierId),
      isDeleted: false,
    };
    
    const result = await this.inventoryService.findAllWithFilter(supplierFilter, query);
    
    // Debug logging for API response
    console.log('🚀 Supplier Inventory API Response:', {
      supplierId,
      itemsFound: result.items.length,
      totalCount: result.total,
      firstItem: result.items[0] ? {
        id: result.items[0]._id,
        name: result.items[0].name,
        sku: result.items[0].sku
      } : null,
      responseStructure: {
        hasItems: !!result.items,
        itemsIsArray: Array.isArray(result.items),
        itemsLength: result.items?.length || 0
      }
    });
    
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({
    status: 200,
    description: 'Inventory statistics retrieved successfully',
  })
  async getStats(@Request() req: any): Promise<any> {
    const user = {
      sub: req.userId,
      email: req.user?.email,
      role: req.userRole,
      tenantId: req.tenantId,
      vendorProfile: req.vendorProfile,
      supplierProfile: req.supplierProfile,
    };
    
    if (!user.tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }

    // Use RBAC service for proper role-based filtering
    const inventoryFilter = this.rbacService.buildInventoryFilter(user);
    
    return this.inventoryService.getInventoryStatsWithFilter(inventoryFilter);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiResponse({
    status: 200,
    description: 'Low stock items retrieved successfully',
    type: [Item],
  })
  async getLowStock(@Request() req: any): Promise<Item[]> {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }

    // SECURITY FIX: ALL users (including admins) must be scoped to their tenant
    // Admin users can see low stock items from all vendors WITHIN THEIR TENANT only
    return this.inventoryService.getLowStockItems(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search inventory items' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [Item],
  })
  async search(
    @Query('term') searchTerm: string,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ): Promise<Item[]> {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }
    return this.inventoryService.searchItems(tenantId, searchTerm, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully',
    type: Item,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Item> {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }
    
    const item = await this.inventoryService.findOne(id, tenantId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: Item,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: any,
  ): Promise<Item> {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.sub;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }
    
    const item = await this.inventoryService.update(id, updateItemDto, tenantId, userId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.sub;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }
    
    try {
      await this.inventoryService.remove(id, tenantId, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Item with ID ${id} not found`);
      }
      throw error;
    }
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update item stock levels' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: Item,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateStock(
    @Param('id') id: string,
    @Body() stockUpdate: {
      quantity: number;
      type: 'add' | 'remove' | 'set';
      reason?: string;
    },
    @Request() req: any,
  ): Promise<Item> {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.sub;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }

    // Convert frontend terminology to backend terminology
    const backendStockUpdate = {
      quantity: stockUpdate.quantity,
      type: stockUpdate.type === 'add' ? 'receipt' as const :
            stockUpdate.type === 'remove' ? 'issue' as const :
            'adjustment' as const,
      reason: stockUpdate.reason,
    };

    const item = await this.inventoryService.updateStock(id, backendStockUpdate, tenantId, userId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }
}
