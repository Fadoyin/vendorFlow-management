import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog, ActivityType, ActivityAction } from './schemas/activity-log.schema';

export interface CreateActivityLogDto {
  tenantId: string;
  userId: string;
  type: ActivityType;
  action: ActivityAction;
  description: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
  ) {}

  /**
   * Create a new activity log entry
   */
  async create(createActivityLogDto: CreateActivityLogDto): Promise<ActivityLog> {
    try {
      const activityLog = new this.activityLogModel({
        ...createActivityLogDto,
        tenantId: new Types.ObjectId(createActivityLogDto.tenantId),
        userId: new Types.ObjectId(createActivityLogDto.userId),
        timestamp: new Date(),
      });

      const savedLog = await activityLog.save();
      this.logger.log(`Activity log created: ${createActivityLogDto.type}:${createActivityLogDto.action} by user ${createActivityLogDto.userId}`);
      return savedLog;
    } catch (error) {
      this.logger.error('Error creating activity log:', error);
      throw error;
    }
  }

  /**
   * Get recent activity logs for a tenant
   */
  async getRecentActivities(
    tenantId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ activities: ActivityLog[]; total: number }> {
    try {
      this.logger.log(`Fetching recent activities for tenant: ${tenantId}, limit: ${limit}`);

      const filter = {
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      };

      const [activities, total] = await Promise.all([
        this.activityLogModel
          .find(filter)
          .populate('userId', 'firstName lastName email')
          .sort({ timestamp: -1 })
          .skip(offset)
          .limit(limit)
          .exec(),
        this.activityLogModel.countDocuments(filter)
      ]);

      this.logger.log(`Found ${activities.length} activities out of ${total} total`);
      
      return { activities, total };
    } catch (error) {
      this.logger.error('Error fetching recent activities:', error);
      
      // Return empty results on error rather than throwing
      return { activities: [], total: 0 };
    }
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(
    tenantId: string,
    type: ActivityType,
    limit: number = 10
  ): Promise<ActivityLog[]> {
    try {
      const filter = {
        tenantId: new Types.ObjectId(tenantId),
        type,
        isDeleted: false,
      };

      return await this.activityLogModel
        .find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error fetching ${type} activities:`, error);
      return [];
    }
  }

  /**
   * Get activities by user
   */
  async getActivitiesByUser(
    tenantId: string,
    userId: string,
    limit: number = 10
  ): Promise<ActivityLog[]> {
    try {
      const filter = {
        tenantId: new Types.ObjectId(tenantId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      };

      return await this.activityLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error fetching activities for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Helper method to create common activity types
   */
  async logOrderActivity(
    tenantId: string,
    userId: string,
    action: ActivityAction,
    orderId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      tenantId,
      userId,
      type: ActivityType.ORDER,
      action,
      description,
      entityId: orderId,
      entityType: 'order',
      metadata,
    });
  }

  async logInventoryActivity(
    tenantId: string,
    userId: string,
    action: ActivityAction,
    itemId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      tenantId,
      userId,
      type: ActivityType.INVENTORY,
      action,
      description,
      entityId: itemId,
      entityType: 'inventory',
      metadata,
    });
  }

  async logVendorActivity(
    tenantId: string,
    userId: string,
    action: ActivityAction,
    vendorId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      tenantId,
      userId,
      type: ActivityType.VENDOR,
      action,
      description,
      entityId: vendorId,
      entityType: 'vendor',
      metadata,
    });
  }

  async logPaymentActivity(
    tenantId: string,
    userId: string,
    action: ActivityAction,
    paymentId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      tenantId,
      userId,
      type: ActivityType.PAYMENT,
      action,
      description,
      entityId: paymentId,
      entityType: 'payment',
      metadata,
    });
  }

  /**
   * Cleanup old activity logs (optional housekeeping)
   */
  async cleanupOldLogs(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.activityLogModel.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      this.logger.log(`Cleaned up ${result.deletedCount} old activity logs older than ${daysOld} days`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up old activity logs:', error);
      return 0;
    }
  }
} 