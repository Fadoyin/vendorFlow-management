import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from '../../common/schemas/item.schema';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AwsService } from '../../common/aws/aws.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../activity-logs/schemas/activity-log.schema';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    private awsService: AwsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    createItemDto: CreateItemDto,
    tenantId?: string, // Made optional for development
    userId?: string, // Made optional for development
    user?: any, // User object to determine vendorId
  ): Promise<Item> {
    try {
      // Check if SKU already exists (temporarily without tenant check)
      const existingItem = await this.itemModel.findOne({
        sku: createItemDto.sku,
        isDeleted: false,
      });

      if (existingItem) {
        throw new ConflictException(
          `Item with SKU ${createItemDto.sku} already exists`,
        );
      }

      // Check if barcode already exists (temporarily without tenant check)
      if (createItemDto.barcode) {
        const existingBarcode = await this.itemModel.findOne({
          barcode: createItemDto.barcode,
          isDeleted: false,
        });

        if (existingBarcode) {
          throw new ConflictException(
            `Item with barcode ${createItemDto.barcode} already exists`,
          );
        }
      }

      // Transform flattened DTO to nested schema format
      const itemData = {
        sku: createItemDto.sku,
        name: createItemDto.name,
        description: createItemDto.description,
        category: createItemDto.category,
        unitOfMeasure: createItemDto.unitOfMeasure,
        tags: createItemDto.tags || [],
        brand: createItemDto.brand,
        model: createItemDto.model,
        manufacturer: createItemDto.manufacturer,
        countryOfOrigin: createItemDto.countryOfOrigin,
        barcode: createItemDto.barcode,
        isSerialized: createItemDto.isSerialized,
        isLotTracked: createItemDto.isLotTracked,
        expiryDate: createItemDto.expiryDate
          ? new Date(createItemDto.expiryDate)
          : undefined,
        // Transform pricing fields to nested object
        pricing: {
          costPrice: createItemDto.costPrice,
          currency: createItemDto.currency || 'USD',
        },
        // Transform inventory fields to nested object
        inventory: {
          currentStock: createItemDto.currentStock,
          availableStock: createItemDto.currentStock,
          remainingQuantity: createItemDto.currentStock,
          reorderPoint: createItemDto.reorderPoint || 20,
          reorderQuantity: createItemDto.reorderQuantity || 50,
          stockUnit: createItemDto.stockUnit || 'piece',
        },
        tenantId: new Types.ObjectId(tenantId),
        // Set vendorId if user is a vendor
        ...(user?.role === 'vendor' && user?.vendorProfile ? { vendorId: new Types.ObjectId(user.vendorProfile) } : {}),
        // Set suppliers array if user is a supplier
        ...(user?.role === 'supplier' && user?.supplierProfile ? { 
          suppliers: [{
            vendorId: user.vendorProfile ? new Types.ObjectId(user.vendorProfile) : new Types.ObjectId(user.sub),
            supplierId: new Types.ObjectId(user.supplierProfile),
            vendorItemCode: createItemDto.sku,
            leadTime: 7,
            leadTimeUnit: 'days',
            minimumOrderQuantity: 1
          }]
        } : {}),
        // Temporarily commented out for development
        // createdBy: new Types.ObjectId(userId),
        // updatedBy: new Types.ObjectId(userId),
      };

      // Debug logging
      this.logger.log(`Creating item for user: ${JSON.stringify({ role: user?.role, vendorProfile: user?.vendorProfile, supplierProfile: user?.supplierProfile, userId: user?.sub })}`);
      this.logger.log(`Item data vendorId: ${itemData.vendorId ? itemData.vendorId.toString() : 'NOT SET'}`);
      this.logger.log(`Item data suppliers: ${itemData.suppliers ? JSON.stringify(itemData.suppliers) : 'NOT SET'}`);
      this.logger.log(`Full item data structure:`, JSON.stringify(itemData, null, 2));

      const item = new this.itemModel(itemData);

      const savedItem = await item.save();
      this.logger.log(`Item created: ${savedItem._id}`);

      // Log activity
      if (tenantId && userId) {
        try {
          await this.activityLogsService.logInventoryActivity(
            tenantId,
            userId,
            ActivityAction.CREATED,
            savedItem._id.toString(),
            `Created new inventory item: ${savedItem.name} (SKU: ${savedItem.sku})`,
            {
              itemName: savedItem.name,
              sku: savedItem.sku,
              category: savedItem.category,
              initialStock: savedItem.inventory?.currentStock || 0,
            }
          );
        } catch (activityError) {
          this.logger.warn('Failed to log inventory activity:', activityError);
        }
      }

      return savedItem;
    } catch (error) {
      this.logger.error(`Error creating item: ${error.message}`);
      throw error;
    }
  }

  async findAllWithFilter(filter: any, query: any): Promise<{ items: Item[]; total: number }> {
    try {
      this.logger.log(`Base filter received: ${JSON.stringify(filter)}`);
      
      // Build comprehensive filter
      const finalFilter = {
        ...filter,
        isDeleted: false,
      };

      this.logger.log(`Final filter applied: ${JSON.stringify(finalFilter)}`);

      // Debug: Let's see what items exist for this tenant first
      const allTenantItems = await this.itemModel.find({ 
        tenantId: filter.tenantId, 
        isDeleted: false 
      }).exec();
      
      this.logger.log(`Total items in tenant: ${allTenantItems.length}`);
      
      // Debug: Show all unique supplier IDs in the database
      const supplierIds = new Set();
      allTenantItems.forEach(item => {
        if (item.suppliers && item.suppliers.length > 0) {
          item.suppliers.forEach(supplier => {
            if (supplier.supplierId) {
              supplierIds.add(supplier.supplierId.toString());
            }
          });
        }
      });
      
      this.logger.log(`Unique supplier IDs in database: [${Array.from(supplierIds).join(', ')}]`);
      this.logger.log(`Looking for supplier ID: ${filter['suppliers.supplierId']}`);
      
      if (allTenantItems.length > 0) {
        this.logger.log(`Sample tenant items:`, allTenantItems.slice(0, 2).map(item => ({
          id: item._id,
          name: item.name,
          sku: item.sku,
          vendorId: item.vendorId,
          suppliers: item.suppliers,
          hasSuppliers: !!item.suppliers && item.suppliers.length > 0,
          suppliersCount: item.suppliers?.length || 0
        })));
      }

      const skip = query.page ? (query.page - 1) * (query.limit || 20) : 0;
      const limit = query.limit || 20;

      // Apply sorting
      const sort: any = {};
      if (query.sortBy) {
        sort[query.sortBy] = query.sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort by creation date
      }

      const [items, total] = await Promise.all([
        this.itemModel.find(finalFilter).sort(sort).skip(skip).limit(limit).exec(),
        this.itemModel.countDocuments(finalFilter).exec(),
      ]);

      this.logger.log(`Found ${items.length} items out of ${total} total for tenant filter`);
      
      return {
        items,
        total,
      };
    } catch (error) {
      this.logger.error(`Error in findAllWithFilter: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    tenantId: string, // REQUIRED for tenant isolation - no longer optional
    query: any = {},
  ): Promise<{ items: Item[]; total: number }> {
    try {
      // SECURITY: Enforce tenant isolation - tenantId is mandatory
      if (!tenantId) {
        throw new Error('Tenant ID is required for security compliance - cannot access inventory without tenant context');
      }

      const {
        page = 1,
        limit = 10,
        search,
        category,
        status,
        location,
        lowStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const filter: any = {
        isDeleted: false,
        // SECURITY: Always filter by tenantId - no exceptions
        tenantId: new Types.ObjectId(tenantId),
      };

      this.logger.log(`Finding inventory for tenant: ${tenantId}`);

      // Search filter
      if (search && search !== 'undefined' && search.trim() !== '') {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
        ];
      }

      // Category filter
      if (category && category !== 'undefined' && category.trim() !== '') {
        filter.category = category;
      }

      // Status filter
      if (status && status !== 'undefined' && status.trim() !== '') {
        filter.status = status;
      }

      // Location filter
      if (location && location !== 'undefined' && location.trim() !== '') {
        filter['inventory.primaryLocation'] = location;
      }

      // Low stock filter
      if (lowStock === 'true') {
        filter.$expr = {
          $lte: ['$inventory.currentStock', '$inventory.reorderPoint'],
        };
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.itemModel
          .find(filter)
          .populate('tenantId', 'companyName email') // Populate tenant info for admin view
          .populate('createdBy', 'firstName lastName email')
          .populate('updatedBy', 'firstName lastName email')
          .populate('primarySupplier', 'name vendorCode email companyName') // Populate vendor info
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        this.itemModel.countDocuments(filter),
      ]);

      this.logger.log(`Found ${items.length} items out of ${total} total`);
      return { items, total };
    } catch (error) {
      this.logger.error(`Error finding items: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<Item> {
    try {
      const item = await this.itemModel
        .findOne({
          _id: new Types.ObjectId(id),
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
        })
        .populate('primarySupplier', 'name vendorCode')
        .populate('suppliers.vendorId', 'name vendorCode')
        .populate('purchaseOrders', 'poNumber status orderDate')
        .populate('forecasts', 'forecastId type validFrom validTo')
        .exec();

      if (!item) {
        throw new NotFoundException(`Item with ID ${id} not found`);
      }

      return item;
    } catch (error) {
      this.logger.error(`Error finding item: ${error.message}`);
      throw error;
    }
  }

  async findBySku(sku: string, tenantId: string): Promise<Item> {
    try {
      const item = await this.itemModel
        .findOne({
          sku,
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
        })
        .populate('primarySupplier', 'name vendorCode')
        .exec();

      if (!item) {
        throw new NotFoundException(`Item with SKU ${sku} not found`);
      }

      return item;
    } catch (error) {
      this.logger.error(`Error finding item by SKU: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateItemDto: any,
    tenantId: string,
    userId: string,
  ): Promise<Item> {
    try {
      const item = await this.itemModel.findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      });

      if (!item) {
        throw new NotFoundException(`Item with ID ${id} not found`);
      }

      // Check if SKU is being updated and if it conflicts
      if (updateItemDto.sku && updateItemDto.sku !== item.sku) {
        const existingItem = await this.itemModel.findOne({
          tenantId: new Types.ObjectId(tenantId),
          sku: updateItemDto.sku,
          _id: { $ne: new Types.ObjectId(id) },
          isDeleted: false,
        });

        if (existingItem) {
          throw new ConflictException(
            `Item with SKU ${updateItemDto.sku} already exists`,
          );
        }
      }

      // Check if barcode is being updated and if it conflicts
      if (updateItemDto.barcode && updateItemDto.barcode !== item.barcode) {
        const existingBarcode = await this.itemModel.findOne({
          tenantId: new Types.ObjectId(tenantId),
          barcode: updateItemDto.barcode,
          _id: { $ne: new Types.ObjectId(id) },
          isDeleted: false,
        });

        if (existingBarcode) {
          throw new ConflictException(
            `Item with barcode ${updateItemDto.barcode} already exists`,
          );
        }
      }

      // Update fields
      const updateData = {
        ...updateItemDto,
        updatedBy: new Types.ObjectId(userId),
        updatedAt: new Date(),
      };

      // Handle date fields
      if (updateItemDto.expiryDate) {
        updateData.expiryDate = new Date(updateItemDto.expiryDate);
      }

      const updatedItem = await this.itemModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('primarySupplier', 'name vendorCode')
        .exec();

      this.logger.log(`Item updated: ${id}`);
      return updatedItem;
    } catch (error) {
      this.logger.error(`Error updating item: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    try {
      const item = await this.itemModel.findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      });

      if (!item) {
        throw new NotFoundException(`Item with ID ${id} not found`);
      }

      // Check if item has active purchase orders
      if (item.purchaseOrders && item.purchaseOrders.length > 0) {
        throw new BadRequestException(
          'Cannot delete item with active purchase orders',
        );
      }

      // Soft delete
      await this.itemModel.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: new Types.ObjectId(userId),
      });

      this.logger.log(`Item deleted: ${id}`);

      // Log activity
      try {
        await this.activityLogsService.logInventoryActivity(
          tenantId,
          userId,
          ActivityAction.DELETED,
          item._id.toString(),
          `Deleted inventory item: ${item.name} (SKU: ${item.sku})`,
          {
            itemName: item.name,
            sku: item.sku,
            category: item.category,
            stockAtDeletion: item.inventory?.currentStock || 0,
          }
        );
      } catch (activityError) {
        this.logger.warn('Failed to log inventory delete activity:', activityError);
      }
    } catch (error) {
      this.logger.error(`Error deleting item: ${error.message}`);
      throw error;
    }
  }

  async updateStock(
    id: string,
    stockUpdate: {
      quantity: number;
      type: 'receipt' | 'issue' | 'adjustment';
      reason?: string;
    },
    tenantId: string,
    userId: string,
  ): Promise<Item> {
    try {
      const item = await this.findOne(id, tenantId);

      let newStock = item.inventory.currentStock;
      const newReservedStock = item.inventory.reservedStock;

      switch (stockUpdate.type) {
        case 'receipt':
          newStock += stockUpdate.quantity;
          break;
        case 'issue':
          if (newStock < stockUpdate.quantity) {
            throw new BadRequestException('Insufficient stock for issue');
          }
          newStock -= stockUpdate.quantity;
          break;
        case 'adjustment':
          newStock = stockUpdate.quantity;
          break;
        default:
          throw new BadRequestException('Invalid stock update type');
      }

      // Calculate available stock
      const availableStock = Math.max(0, newStock - newReservedStock);

      const updatedItem = await this.itemModel.findByIdAndUpdate(
        id,
        {
          'inventory.currentStock': newStock,
          'inventory.availableStock': availableStock,
          'inventory.lastStockMovement': new Date(),
          updatedBy: new Types.ObjectId(userId),
          updatedAt: new Date(),
        },
        { new: true },
      );

      this.logger.log(
        `Stock updated for item ${id}: ${stockUpdate.type} ${stockUpdate.quantity}`,
      );

      // Log activity
      try {
        const actionMap = {
          'receipt': ActivityAction.RESTOCKED,
          'issue': ActivityAction.UPDATED,
          'adjustment': ActivityAction.UPDATED,
        };

        const action = actionMap[stockUpdate.type] || ActivityAction.UPDATED;
        const oldStock = item.inventory.currentStock;
        const changeAmount = newStock - oldStock;
        const changeSymbol = changeAmount >= 0 ? '+' : '';

        await this.activityLogsService.logInventoryActivity(
          tenantId,
          userId,
          action,
          item._id.toString(),
          `Stock ${stockUpdate.type}: ${item.name} (${changeSymbol}${changeAmount} units, now ${newStock})`,
          {
            itemName: item.name,
            sku: item.sku,
            updateType: stockUpdate.type,
            quantity: stockUpdate.quantity,
            oldStock: oldStock,
            newStock: newStock,
            reason: stockUpdate.reason,
          }
        );

        // Check for low stock alert
        if (newStock <= item.inventory.reorderPoint && oldStock > item.inventory.reorderPoint) {
          await this.activityLogsService.logInventoryActivity(
            tenantId,
            userId,
            ActivityAction.LOW_STOCK,
            item._id.toString(),
            `Low stock alert: ${item.name} (${newStock} remaining, reorder point: ${item.inventory.reorderPoint})`,
            {
              itemName: item.name,
              sku: item.sku,
              currentStock: newStock,
              reorderPoint: item.inventory.reorderPoint,
            }
          );
        }

        // Check for out of stock alert
        if (newStock === 0 && oldStock > 0) {
          await this.activityLogsService.logInventoryActivity(
            tenantId,
            userId,
            ActivityAction.OUT_OF_STOCK,
            item._id.toString(),
            `Out of stock: ${item.name}`,
            {
              itemName: item.name,
              sku: item.sku,
            }
          );
        }
      } catch (activityError) {
        this.logger.warn('Failed to log inventory stock update activity:', activityError);
      }

      return updatedItem;
    } catch (error) {
      this.logger.error(`Error updating stock: ${error.message}`);
      throw error;
    }
  }

  async reserveStock(
    id: string,
    quantity: number,
    tenantId: string,
    userId: string,
  ): Promise<Item> {
    try {
      const item = await this.findOne(id, tenantId);

      if (item.inventory.availableStock < quantity) {
        throw new BadRequestException(
          'Insufficient available stock for reservation',
        );
      }

      const newReservedStock = item.inventory.reservedStock + quantity;
      const newAvailableStock = item.inventory.availableStock - quantity;

      const updatedItem = await this.itemModel.findByIdAndUpdate(
        id,
        {
          'inventory.reservedStock': newReservedStock,
          'inventory.availableStock': newAvailableStock,
          'inventory.lastStockMovement': new Date(),
          updatedBy: new Types.ObjectId(userId),
          updatedAt: new Date(),
        },
        { new: true },
      );

      this.logger.log(`Stock reserved for item ${id}: ${quantity}`);
      return updatedItem;
    } catch (error) {
      this.logger.error(`Error reserving stock: ${error.message}`);
      throw error;
    }
  }

  async releaseReservedStock(
    id: string,
    quantity: number,
    tenantId: string,
    userId: string,
  ): Promise<Item> {
    try {
      const item = await this.findOne(id, tenantId);

      if (item.inventory.reservedStock < quantity) {
        throw new BadRequestException('Insufficient reserved stock to release');
      }

      const newReservedStock = Math.max(
        0,
        item.inventory.reservedStock - quantity,
      );
      const newAvailableStock = item.inventory.availableStock + quantity;

      const updatedItem = await this.itemModel.findByIdAndUpdate(
        id,
        {
          'inventory.reservedStock': newReservedStock,
          'inventory.availableStock': newAvailableStock,
          'inventory.lastStockMovement': new Date(),
          updatedBy: new Types.ObjectId(userId),
          updatedAt: new Date(),
        },
        { new: true },
      );

      this.logger.log(`Reserved stock released for item ${id}: ${quantity}`);
      return updatedItem;
    } catch (error) {
      this.logger.error(`Error releasing reserved stock: ${error.message}`);
      throw error;
    }
  }

  async uploadImage(
    id: string,
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ): Promise<Item> {
    try {
      const item = await this.findOne(id, tenantId);

      // Upload file to S3
      const uploadResult = await this.awsService.uploadFile(
        file,
        `inventory/${tenantId}/${id}/images`,
        {
          itemId: id,
          imageType: 'item_image',
          uploadedBy: userId,
        },
      );

      // Add image to item
      const updatedItem = await this.itemModel.findByIdAndUpdate(
        id,
        {
          $push: { images: uploadResult.key },
          updatedBy: new Types.ObjectId(userId),
          updatedAt: new Date(),
        },
        { new: true },
      );

      this.logger.log(`Image uploaded for item: ${id}`);
      return updatedItem;
    } catch (error) {
      this.logger.error(`Error uploading image: ${error.message}`);
      throw error;
    }
  }

  async getInventoryStats(tenantId: string): Promise<any> {
    try {
      // SECURITY: Enforce tenant isolation - tenantId is mandatory
      if (!tenantId) {
        throw new Error('Tenant ID is required for security compliance - cannot access inventory stats without tenant context');
      }

      // Build match filter - always include tenantId for security
      const matchFilter: any = {
        isDeleted: false,
        tenantId: new Types.ObjectId(tenantId),
      };

      this.logger.log(`Getting inventory stats for tenant: ${tenantId}`);

      const stats = await this.itemModel.aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalStockValue: {
              $sum: {
                $multiply: ['$inventory.currentStock', '$pricing.costPrice'],
              },
            },
            lowStockItems: {
              $sum: {
                $cond: [
                  {
                    $lte: [
                      '$inventory.currentStock',
                      '$inventory.reorderPoint',
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            outOfStockItems: {
              $sum: {
                $cond: [{ $eq: ['$inventory.currentStock', 0] }, 1, 0],
              },
            },
            avgStockLevel: { $avg: '$inventory.currentStock' },
          },
        },
      ]);

      const categoryStats = await this.itemModel.aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$inventory.currentStock' },
            avgStock: { $avg: '$inventory.currentStock' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const locationStats = await this.itemModel.aggregate([
        {
          $match: {
            ...matchFilter,
            'inventory.primaryLocation': { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$inventory.primaryLocation',
            count: { $sum: 1 },
            totalStock: { $sum: '$inventory.currentStock' },
          },
        },
        {
          $sort: { totalStock: -1 },
        },
      ]);

      return {
        overview: stats[0] || {
          totalItems: 0,
          totalStockValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          avgStockLevel: 0,
        },
        byCategory: categoryStats,
        byLocation: locationStats,
      };
    } catch (error) {
      this.logger.error(`Error getting inventory stats: ${error.message}`);
      throw error;
    }
  }

  async getInventoryStatsWithFilter(filter: any): Promise<any> {
    try {
      // Use the provided filter and ensure isDeleted is false
      const matchFilter = {
        ...filter,
        isDeleted: false,
      };

      const stats = await this.itemModel.aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalStockValue: {
              $sum: {
                $multiply: ['$inventory.currentStock', '$pricing.costPrice'],
              },
            },
            lowStockItems: {
              $sum: {
                $cond: [
                  {
                    $lte: [
                      '$inventory.currentStock',
                      '$inventory.reorderPoint',
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            outOfStockItems: {
              $sum: {
                $cond: [{ $eq: ['$inventory.currentStock', 0] }, 1, 0],
              },
            },
            avgStockLevel: { $avg: '$inventory.currentStock' },
          },
        },
      ]);

      const categoryStats = await this.itemModel.aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$inventory.currentStock' },
            avgStock: { $avg: '$inventory.currentStock' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const locationStats = await this.itemModel.aggregate([
        {
          $match: {
            ...matchFilter,
            'inventory.primaryLocation': { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$inventory.primaryLocation',
            count: { $sum: 1 },
            totalStock: { $sum: '$inventory.currentStock' },
          },
        },
        {
          $sort: { totalStock: -1 },
        },
      ]);

      return {
        overview: stats[0] || {
          totalItems: 0,
          totalStockValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          avgStockLevel: 0,
        },
        byCategory: categoryStats,
        byLocation: locationStats,
      };
    } catch (error) {
      this.logger.error(`Error getting inventory stats with filter: ${error.message}`);
      throw error;
    }
  }

  async getLowStockItems(
    tenantId: string, // REQUIRED for tenant isolation
    limit: number = 20,
  ): Promise<Item[]> {
    try {
      // SECURITY: Enforce tenant isolation - tenantId is mandatory
      if (!tenantId) {
        throw new Error('Tenant ID is required for security compliance - cannot access low stock items without tenant context');
      }

      // Build filter - always include tenantId for security
      const filter: any = {
        isDeleted: false,
        tenantId: new Types.ObjectId(tenantId),
        $expr: {
          $lte: ['$inventory.currentStock', '$inventory.reorderPoint'],
        },
      };

      this.logger.log(`Finding low stock items for tenant: ${tenantId}`);

      const items = await this.itemModel
        .find(filter)
        .populate('tenantId', 'companyName email') // Populate tenant info for admin view
        .sort({ 'inventory.currentStock': 1 })
        .limit(limit)
        .populate('primarySupplier', 'name vendorCode')
        .exec();

      return items;
    } catch (error) {
      this.logger.error(`Error getting low stock items: ${error.message}`);
      throw error;
    }
  }

  async searchItems(
    tenantId: string,
    searchTerm: string,
    limit: number = 10,
  ): Promise<Item[]> {
    try {
      const items = await this.itemModel
        .find({
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { sku: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { barcode: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          ],
        })
        .limit(limit)
        .populate('primarySupplier', 'name vendorCode')
        .exec();

      return items;
    } catch (error) {
      this.logger.error(`Error searching items: ${error.message}`);
      throw error;
    }
  }
}
