import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../common/schemas/order.schema';
import { Vendor } from '../../common/schemas/vendor.schema';
import { Item } from '../../common/schemas/item.schema';
import { PaymentTransaction } from '../payments/schemas/payment-transaction.schema';
// import { AwsService } from '../../common/aws/aws.service'; // Temporarily disabled
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(PaymentTransaction.name) private paymentModel: Model<PaymentTransaction>,
    private configService: ConfigService,
    // private awsService: AwsService, // Temporarily disabled for auth testing
  ) {}

  async create(createUserDto: CreateUserDto, tenantId: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
      tenantId,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password if provided
    if (createUserDto.password) {
      const saltRounds = 10;
      createUserDto.password = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );
    }

    // Create user with tenant context
    const user = new this.userModel({
      ...createUserDto,
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
      lastLoginAt: null,
    });

    return user.save();
  }

  async findAll(tenantId: string, query: any = {}): Promise<User[]> {
    const { page = 1, limit = 10, search, role, isActive } = query;

    const filter: any = { tenantId: new Types.ObjectId(tenantId) };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    return this.userModel
      .find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string, tenantId: string): Promise<User> {
    const user = await this.userModel.findOne({ email, tenantId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    tenantId: string,
  ): Promise<User> {
    // Verify user belongs to tenant
    const user = await this.userModel.findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Note: Password updates are handled separately via changePassword method

    // Update user
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    return updatedUser;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    // Verify user belongs to tenant
    const user = await this.userModel.findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user can be deleted (not last admin)
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.userModel.countDocuments({
        tenantId,
        role: 'Admin',
        isActive: true,
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    await this.userModel.findByIdAndDelete(id).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, {
        lastLoginAt: new Date(),
      })
      .exec();
  }

  async getUsersCount(tenantId: string): Promise<number> {
    return this.userModel.countDocuments({ tenantId, isActive: true });
  }

  async getUsersByRole(tenantId: string, role: string): Promise<User[]> {
    return this.userModel
      .find({ tenantId, role, isActive: true })
      .select('-password')
      .exec();
  }

  async deactivateUser(id: string, tenantId: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, tenantId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-password')
      .exec();
  }

  async activateUser(id: string, tenantId: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, tenantId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .select('-password')
      .exec();
  }

  async updateProfilePicture(
    id: string,
    file: Express.Multer.File,
    tenantId: string,
  ): Promise<string> {
    const user = await this.userModel.findOne({ _id: id, tenantId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload to S3 - Temporarily disabled for auth testing
    // const key = `users/${tenantId}/${id}/profile-${Date.now()}`;
    // const url = await this.awsService.uploadFile(file, key);
    const url = `https://placeholder-image-url.com/profile-${Date.now()}.jpg`; // Temporary mock

    // Update user profile
    await this.userModel.findByIdAndUpdate(id, {
      profilePicture: url,
    });

    return url;
  }

  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
    tenantId: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ 
      _id: new Types.ObjectId(id), 
      tenantId: new Types.ObjectId(tenantId) 
    }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    if (!user.password || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new BadRequestException('Invalid old password');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async resetPassword(email: string, tenantId: string): Promise<void> {
    const user = await this.userModel.findOne({ email, tenantId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Update password
    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      isPasswordTemporary: true,
    });

    // TODO: Send email with temporary password
    // This would integrate with SES or similar service
  }

  /**
   * Get comprehensive admin dashboard statistics
   */
  async getAdminDashboardStats(tenantId: string): Promise<any> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const filter = {
        tenantId: new Types.ObjectId(tenantId),
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      };

      // Get comprehensive stats in parallel
      const [
        orderStats,
        vendorStats,
        inventoryStats,
        paymentStats,
        todayOrdersCount,
        thisMonthOrdersCount,
        lastMonthOrdersCount
      ] = await Promise.all([
        // Total orders
        this.orderModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              pendingCount: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
              }
            }
          }
        ]),
        
        // Vendor stats
        this.vendorModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalVendors: { $sum: 1 },
              activeCount: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
              }
            }
          }
        ]),
        
        // Inventory stats
        this.itemModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalItems: { $sum: 1 },
              totalValue: { $sum: { $multiply: ['$pricing.cost', '$inventory.currentStock'] } },
              lowStockCount: {
                $sum: {
                  $cond: [
                    { $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]),
        
        // Payment/Revenue stats
        this.paymentModel.aggregate([
          { 
            $match: { 
              ...filter,
              status: { $in: ['completed', 'success'] }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              thisMonthRevenue: {
                $sum: {
                  $cond: [
                    { $gte: ['$createdAt', startOfMonth] },
                    '$amount',
                    0
                  ]
                }
              },
              lastMonthRevenue: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$createdAt', startOfLastMonth] },
                        { $lte: ['$createdAt', endOfLastMonth] }
                      ]
                    },
                    '$amount',
                    0
                  ]
                }
              }
            }
          }
        ]),
        
        // Today's orders
        this.orderModel.countDocuments({
          ...filter,
          createdAt: { $gte: startOfToday }
        }),
        
        // This month's orders
        this.orderModel.countDocuments({
          ...filter,
          createdAt: { $gte: startOfMonth }
        }),
        
        // Last month's orders
        this.orderModel.countDocuments({
          ...filter,
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        })
      ]);

      // Process results
      const orders = orderStats[0] || { totalOrders: 0, pendingCount: 0 };
      const vendors = vendorStats[0] || { totalVendors: 0, activeCount: 0 };
      const inventory = inventoryStats[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0 };
      const payments = paymentStats[0] || { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0 };

      // Calculate growth percentages
      const orderGrowth = lastMonthOrdersCount > 0 
        ? ((thisMonthOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount) * 100 
        : 0;

      const revenueGrowth = payments.lastMonthRevenue > 0 
        ? ((payments.thisMonthRevenue - payments.lastMonthRevenue) / payments.lastMonthRevenue) * 100 
        : 0;

      // Get new vendors this week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const newVendorsThisWeek = await this.vendorModel.countDocuments({
        ...filter,
        createdAt: { $gte: startOfWeek }
      });

      return {
        orders: {
          total: orders.totalOrders,
          monthlyGrowth: Number(orderGrowth.toFixed(1)),
          todayCount: todayOrdersCount,
          pendingCount: orders.pendingCount
        },
        revenue: {
          total: payments.totalRevenue,
          monthlyGrowth: Number(revenueGrowth.toFixed(1)),
          thisMonth: payments.thisMonthRevenue,
          lastMonth: payments.lastMonthRevenue
        },
        vendors: {
          total: vendors.totalVendors,
          newThisWeek: newVendorsThisWeek,
          activeCount: vendors.activeCount
        },
        inventory: {
          totalItems: inventory.totalItems,
          lowStockCount: inventory.lowStockCount,
          totalValue: inventory.totalValue
        }
      };

    } catch (error) {
      console.error('Error getting admin dashboard stats:', error);
      throw new BadRequestException('Failed to retrieve dashboard statistics');
    }
  }
}
