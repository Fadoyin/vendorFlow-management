import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../../common/schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

interface QueryOptions {
  page: number;
  limit: number;
  status?: string;
  vendorId?: string;
  supplierId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  /**
   * Create a new order with tenant isolation
   */
  async create(
    createOrderDto: CreateOrderDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    try {
      this.logger.log(`Creating order for tenant: ${tenantId}, user: ${userId}, role: ${userRole}`);

      // Generate order number
      const orderNumber = await this.generateOrderNumber(tenantId);

      // Calculate totals
      const subtotal = createOrderDto.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      );
      const totalAmount = subtotal + (createOrderDto.taxAmount || 0) + 
                         (createOrderDto.shippingCost || 0) - 
                         (createOrderDto.discountAmount || 0);

      const order = new this.orderModel({
        tenantId: new Types.ObjectId(tenantId),
        orderId: createOrderDto.orderId,
        vendorId: createOrderDto.vendorId ? new Types.ObjectId(createOrderDto.vendorId) : new Types.ObjectId(userId),
        supplierId: createOrderDto.supplierId ? new Types.ObjectId(createOrderDto.supplierId) : undefined,
        status: createOrderDto.status || 'placed', // Use valid enum value
        orderDate: createOrderDto.orderDate ? new Date(createOrderDto.orderDate) : new Date(),
        items: createOrderDto.items.map(item => ({
          inventoryId: new Types.ObjectId(item.itemId), // Use inventoryId to match schema
          stockName: item.itemName, // Use stockName to match schema
          sku: item.sku || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          notes: item.notes || item.description || '',
        })),
        subtotal,
        tax: createOrderDto.taxAmount || 0, // Use 'tax' to match schema
        shipping: createOrderDto.shippingCost || 0, // Use 'shipping' to match schema  
        discount: createOrderDto.discountAmount || 0, // Use 'discount' to match schema
        totalAmount,
        currency: createOrderDto.currency || 'USD',
        priority: createOrderDto.priority || 'medium',
        expectedArrivalDate: createOrderDto.expectedDeliveryDate ? 
          new Date(createOrderDto.expectedDeliveryDate) : undefined, // Use expectedArrivalDate to match schema
        notes: createOrderDto.notes,
      });

      const savedOrder = await order.save();
      this.logger.log(`Order created successfully: ${savedOrder.orderId}`);
      this.logger.log(`Order vendorId: ${savedOrder.vendorId}, tenantId: ${savedOrder.tenantId}`);
      this.logger.log(`Order status: ${savedOrder.status}, totalAmount: ${savedOrder.totalAmount}`);
      
      return savedOrder;

    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all orders with tenant and role filtering
   */
  async findAll(
    tenantId: string,
    userId: string,
    userRole: string,
    options: QueryOptions,
  ): Promise<{ orders: Order[]; total: number; pagination: any }> {
    try {
      this.logger.log(`Finding orders for tenant: ${tenantId}, role: ${userRole}`);

      // Base filter with tenant isolation
      const filter: any = {
        tenantId: new Types.ObjectId(tenantId),
      };

      // Role-based filtering
      if (userRole === 'vendor') {
        filter.vendorId = new Types.ObjectId(userId);
      } else if (userRole === 'supplier') {
        filter.supplierId = new Types.ObjectId(userId);
      }
      // Admin sees all orders within tenant

      // Apply additional filters
      if (options.status) {
        filter.status = options.status;
      }

      if (options.vendorId && userRole === 'admin') {
        filter.vendorId = new Types.ObjectId(options.vendorId);
      }

      if (options.supplierId && userRole === 'admin') {
        filter.supplierId = new Types.ObjectId(options.supplierId);
      }

      if (options.startDate || options.endDate) {
        filter.createdAt = {};
        if (options.startDate) filter.createdAt.$gte = options.startDate;
        if (options.endDate) filter.createdAt.$lte = options.endDate;
      }

      if (options.search) {
        filter.$or = [
          { orderId: { $regex: options.search, $options: 'i' } },
          { 'items.name': { $regex: options.search, $options: 'i' } },
          { notes: { $regex: options.search, $options: 'i' } },
        ];
      }

      const skip = (options.page - 1) * options.limit;

      const [orders, total] = await Promise.all([
        this.orderModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.limit)
          .populate('vendorId', 'name vendorCode')
          .populate('supplierId', 'supplierName supplierCode')
          .lean(),
        this.orderModel.countDocuments(filter),
      ]);

      return {
        orders,
        total,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      };

    } catch (error) {
      this.logger.error(`Error finding orders: ${error.message}`);
      throw new BadRequestException('Failed to retrieve orders');
    }
  }

  /**
   * Get order statistics
   */
  async getStats(
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    try {
      const filter: any = {
        tenantId: new Types.ObjectId(tenantId),
      };

      // Role-based filtering
      if (userRole === 'vendor') {
        filter.vendorId = new Types.ObjectId(userId);
      } else if (userRole === 'supplier') {
        filter.supplierId = new Types.ObjectId(userId);
      }

      // Get current date ranges for comparison
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get comprehensive stats
      const [totalStats, todayStats, thisMonthStats, lastMonthStats] = await Promise.all([
        // Total stats
        this.orderModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$totalAmount' },
              avgOrderValue: { $avg: '$totalAmount' },
              statusBreakdown: { $push: '$status' },
            },
          },
        ]),
        
        // Today's stats
        this.orderModel.aggregate([
          { 
            $match: { 
              ...filter, 
              createdAt: { $gte: startOfToday } 
            } 
          },
          {
            $group: {
              _id: null,
              todayCount: { $sum: 1 },
              todayRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
        
        // This month's stats
        this.orderModel.aggregate([
          { 
            $match: { 
              ...filter, 
              createdAt: { $gte: startOfMonth } 
            } 
          },
          {
            $group: {
              _id: null,
              thisMonthCount: { $sum: 1 },
              thisMonthRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
        
        // Last month's stats
        this.orderModel.aggregate([
          { 
            $match: { 
              ...filter, 
              createdAt: { 
                $gte: startOfLastMonth,
                $lte: endOfLastMonth 
              } 
            } 
          },
          {
            $group: {
              _id: null,
              lastMonthCount: { $sum: 1 },
              lastMonthRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
      ]);

      // Process results
      const total = totalStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, statusBreakdown: [] };
      const today = todayStats[0] || { todayCount: 0, todayRevenue: 0 };
      const thisMonth = thisMonthStats[0] || { thisMonthCount: 0, thisMonthRevenue: 0 };
      const lastMonth = lastMonthStats[0] || { lastMonthCount: 0, lastMonthRevenue: 0 };

      // Calculate growth percentages
      const monthlyGrowth = lastMonth.lastMonthCount > 0 
        ? ((thisMonth.thisMonthCount - lastMonth.lastMonthCount) / lastMonth.lastMonthCount) * 100
        : thisMonth.thisMonthCount > 0 ? 100 : 0;

      // Process status breakdown
      const statusBreakdown = total.statusBreakdown.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Get pending orders count
      const pendingCount = statusBreakdown['pending'] || 0;

      return {
        totalOrders: total.totalOrders,
        totalRevenue: total.totalRevenue,
        avgOrderValue: total.avgOrderValue,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Round to 1 decimal
        todayCount: today.todayCount,
        pendingCount,
        thisMonthCount: thisMonth.thisMonthCount,
        lastMonthCount: lastMonth.lastMonthCount,
        statusBreakdown,
      };

    } catch (error) {
      this.logger.error(`Error getting order stats: ${error.message}`);
      throw new BadRequestException('Failed to retrieve order statistics');
    }
  }

  /**
   * Find orders by vendor
   */
  async findByVendor(
    vendorId: string,
    tenantId: string,
    userId: string,
    userRole: string,
    options: Partial<QueryOptions>,
  ): Promise<{ orders: Order[]; total: number; pagination: any }> {
    // Check permissions
    if (userRole === 'vendor' && vendorId !== userId) {
      throw new ForbiddenException('Cannot access other vendor orders');
    }

    return this.findAll(tenantId, userId, userRole, {
      ...options,
      vendorId,
      page: options.page || 1,
      limit: options.limit || 20,
    });
  }

  /**
   * Find orders by supplier
   */
  async findBySupplier(
    supplierId: string,
    tenantId: string,
    userId: string,
    userRole: string,
    options: Partial<QueryOptions>,
  ): Promise<{ orders: Order[]; total: number; pagination: any }> {
    // Check permissions
    if (userRole === 'supplier' && supplierId !== userId) {
      throw new ForbiddenException('Cannot access other supplier orders');
    }

    return this.findAll(tenantId, userId, userRole, {
      ...options,
      supplierId,
      page: options.page || 1,
      limit: options.limit || 20,
    });
  }

  /**
   * Find one order by ID
   */
  async findOne(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    try {
      const filter: any = {
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      };

      // Role-based filtering
      if (userRole === 'vendor') {
        filter.vendorId = new Types.ObjectId(userId);
      } else if (userRole === 'supplier') {
        filter.supplierId = new Types.ObjectId(userId);
      }

      const order = await this.orderModel
        .findOne(filter)
        .populate('vendorId', 'name vendorCode')
        .populate('supplierId', 'supplierName supplierCode')
        .populate('createdBy', 'firstName lastName email')
        .lean();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;

    } catch (error) {
      this.logger.error(`Error finding order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an order
   */
  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    try {
      const order = await this.findOne(id, tenantId, userId, userRole);

      // Check if user can modify this order
      if (userRole === 'vendor' && order.vendorId?.toString() !== userId) {
        throw new ForbiddenException('Cannot modify this order');
      }

      if (userRole === 'supplier' && order.supplierId?.toString() !== userId) {
        throw new ForbiddenException('Cannot modify this order');
      }

      // Recalculate totals if items are updated
      let updateData = { ...updateOrderDto };
      
      if (updateOrderDto.items) {
        const subtotal = updateOrderDto.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice),
          0
        );
        
        updateData = {
          ...updateData,
          subtotal,
          totalAmount: subtotal + (updateOrderDto.taxAmount || 0) + 
                      (updateOrderDto.shippingCost || 0) - 
                      (updateOrderDto.discountAmount || 0),
        };
      }

      const updatedOrder = await this.orderModel
        .findOneAndUpdate(
          { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
          { ...updateData, updatedBy: new Types.ObjectId(userId) },
          { new: true }
        )
        .populate('vendorId', 'name vendorCode')
        .populate('supplierId', 'supplierName supplierCode');

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      this.logger.log(`Order updated: ${updatedOrder.orderId}`);
      return updatedOrder;

    } catch (error) {
      this.logger.error(`Error updating order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: string,
    status: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    try {
      const order = await this.findOne(id, tenantId, userId, userRole);

      // Validate status transition
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException('Invalid status');
      }

      const updatedOrder = await this.orderModel
        .findOneAndUpdate(
          { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
          { 
            status,
            updatedBy: new Types.ObjectId(userId),
            statusHistory: {
              $push: {
                status,
                updatedBy: new Types.ObjectId(userId),
                updatedAt: new Date(),
              }
            }
          },
          { new: true }
        )
        .populate('vendorId', 'name vendorCode')
        .populate('supplierId', 'supplierName supplierCode');

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      this.logger.log(`Order status updated: ${updatedOrder.orderId} -> ${status}`);
      return updatedOrder;

    } catch (error) {
      this.logger.error(`Error updating order status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove an order
   */
  async remove(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    try {
      const order = await this.findOne(id, tenantId, userId, userRole);

      // Only admins can delete orders
      if (userRole !== 'admin') {
        throw new ForbiddenException('Only administrators can delete orders');
      }

      await this.orderModel.findOneAndDelete({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      });

      this.logger.log(`Order deleted: ${order.orderId}`);
      return { message: 'Order deleted successfully' };

    } catch (error) {
      this.logger.error(`Error deleting order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last order for this tenant in current month
    const lastOrder = await this.orderModel
      .findOne(
        {
          tenantId: new Types.ObjectId(tenantId),
          orderId: { $regex: `^ORD-${year}${month}` }
        },
        {},
        { sort: { orderId: -1 } }
      );

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderId.split('-')[2] || '0');
      nextNumber = lastNumber + 1;
    }

    return `ORD-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Get enhanced dashboard statistics
   */
  async getDashboardStats(
    tenantId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    try {
      const filter: any = {
        tenantId: new Types.ObjectId(tenantId),
      };

      // Role-based filtering
      if (userRole === 'vendor') {
        filter.vendorId = new Types.ObjectId(userId);
      } else if (userRole === 'supplier') {
        filter.supplierId = new Types.ObjectId(userId);
      }

      // Get current date ranges for comparison
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get comprehensive stats
      const [totalStats, todayStats, thisMonthStats, lastMonthStats] = await Promise.all([
        // Total stats
        this.orderModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$totalAmount' },
              avgOrderValue: { $avg: '$totalAmount' },
              statusBreakdown: { $push: '$status' },
            },
          },
        ]),
        
        // Today's stats
        this.orderModel.aggregate([
          { 
            $match: { 
              ...filter, 
              createdAt: { $gte: startOfToday } 
            } 
          },
          {
            $group: {
              _id: null,
              todayCount: { $sum: 1 },
              todayRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
        
        // This month's stats
        this.orderModel.aggregate([
          { 
            $match: { 
              ...filter, 
              createdAt: { $gte: startOfMonth } 
            } 
          },
          {
            $group: {
              _id: null,
              thisMonthCount: { $sum: 1 },
              thisMonthRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
        
        // Last month's stats
        this.orderModel.aggregate([
          { 
            $match: { 
              ...filter, 
              createdAt: { 
                $gte: startOfLastMonth,
                $lte: endOfLastMonth 
              } 
            } 
          },
          {
            $group: {
              _id: null,
              lastMonthCount: { $sum: 1 },
              lastMonthRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
      ]);

      // Process results
      const total = totalStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, statusBreakdown: [] };
      const today = todayStats[0] || { todayCount: 0, todayRevenue: 0 };
      const thisMonth = thisMonthStats[0] || { thisMonthCount: 0, thisMonthRevenue: 0 };
      const lastMonth = lastMonthStats[0] || { lastMonthCount: 0, lastMonthRevenue: 0 };

      // Calculate growth percentages
      const monthlyGrowth = lastMonth.lastMonthCount > 0 
        ? ((thisMonth.thisMonthCount - lastMonth.lastMonthCount) / lastMonth.lastMonthCount) * 100
        : thisMonth.thisMonthCount > 0 ? 100 : 0;

      // Process status breakdown
      const statusBreakdown = total.statusBreakdown.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Get pending orders count
      const pendingCount = statusBreakdown['pending'] || 0;

      return {
        totalOrders: total.totalOrders,
        totalRevenue: total.totalRevenue,
        avgOrderValue: total.avgOrderValue,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Round to 1 decimal
        todayCount: today.todayCount,
        pendingCount,
        thisMonthCount: thisMonth.thisMonthCount,
        lastMonthCount: lastMonth.lastMonthCount,
        statusBreakdown,
      };

    } catch (error) {
      this.logger.error(`Error getting dashboard stats: ${error.message}`);
      throw new BadRequestException('Failed to retrieve dashboard statistics');
    }
  }
}
