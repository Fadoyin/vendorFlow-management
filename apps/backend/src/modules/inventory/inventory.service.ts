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

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    private awsService: AwsService,
  ) {}

  async create(
    createItemDto: CreateItemDto,
    tenantId?: string, // Made optional for development
    userId?: string, // Made optional for development
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
        // Temporarily commented out for development
        // createdBy: new Types.ObjectId(userId),
        // updatedBy: new Types.ObjectId(userId),
      };

      const item = new this.itemModel(itemData);

      const savedItem = await item.save();
      this.logger.log(`Item created: ${savedItem._id}`);

      return savedItem;
    } catch (error) {
      this.logger.error(`Error creating item: ${error.message}`);
      throw error;
    }
  }

  async findAllWithFilter(
    baseFilter: any,
    query: any = {},
  ): Promise<{ items: Item[]; total: number }> {
    try {
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
        ...baseFilter,
        isDeleted: false,
      };

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

      this.logger.log(`Found ${items.length} items out of ${total} total for tenant filter`);
      return { items, total };
    } catch (error) {
      this.logger.error(`Error finding items with filter: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    tenantId?: string, // Made optional for development
    query: any = {},
  ): Promise<{ items: Item[]; total: number }> {
    try {
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
      };

      // Add tenantId filter only if provided (admins get null, vendors get their tenantId)
      if (tenantId) {
        filter.tenantId = new Types.ObjectId(tenantId);
      }

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

  async getInventoryStats(tenantId?: string): Promise<any> {
    try {
      // Build match filter - include tenantId only if provided
      const matchFilter: any = {
        isDeleted: false,
      };
      if (tenantId) {
        matchFilter.tenantId = new Types.ObjectId(tenantId);
      }

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

  async getLowStockItems(
    tenantId?: string,
    limit: number = 20,
  ): Promise<Item[]> {
    try {
      // Build filter - include tenantId only if provided
      const filter: any = {
        isDeleted: false,
        $expr: {
          $lte: ['$inventory.currentStock', '$inventory.reorderPoint'],
        },
      };
      if (tenantId) {
        filter.tenantId = new Types.ObjectId(tenantId);
      }

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
