import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly configService: ConfigService,
  ) {}

  async create(notificationData: {
    userId: string;
    vendorId?: string;
    type: NotificationType;
    priority?: NotificationPriority;
    channel: NotificationChannel;
    title: string;
    message: string;
    data?: any;
    channels?: NotificationChannel[];
    scheduledAt?: Date;
    template?: any;
    tags?: string[];
  }): Promise<Notification> {
    try {
      const notification = new this.notificationModel({
        ...notificationData,
        userId: new Types.ObjectId(notificationData.userId),
        vendorId: notificationData.vendorId
          ? new Types.ObjectId(notificationData.vendorId)
          : undefined,
        priority: notificationData.priority || NotificationPriority.MEDIUM,
        channels: notificationData.channels || [notificationData.channel],
        retryCount: 0,
      });

      const savedNotification = await notification.save();

      // Send notification immediately if not scheduled
      if (!notificationData.scheduledAt) {
        this.sendNotification(savedNotification._id.toString()).catch(
          (error) => {
            this.logger.error(`Failed to send notification: ${error.message}`);
          },
        );
      }

      return savedNotification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`);
      throw new BadRequestException('Failed to create notification');
    }
  }

  async findAll(
    userId?: string,
    vendorId?: string,
    type?: NotificationType,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    try {
      const filter: any = {};

      if (userId) {
        filter.userId = new Types.ObjectId(userId);
      }

      if (vendorId) {
        filter.vendorId = new Types.ObjectId(vendorId);
      }

      if (type) {
        filter.type = type;
      }

      if (status) {
        filter.status = status;
      }

      return await this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Error finding notifications: ${error.message}`);
      throw new BadRequestException('Failed to retrieve notifications');
    }
  }

  async findOne(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(id).exec();
      if (!notification) {
        throw new NotFoundException('Notification not found');
      }
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding notification: ${error.message}`);
      throw new BadRequestException('Failed to retrieve notification');
    }
  }

  async update(id: string, updateData: any): Promise<Notification> {
    try {
      const notification = await this.notificationModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating notification: ${error.message}`);
      throw new BadRequestException('Failed to update notification');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.notificationModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException('Notification not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error removing notification: ${error.message}`);
      throw new BadRequestException('Failed to remove notification');
    }
  }

  async sendNotification(notificationId: string): Promise<void> {
    try {
      const notification = await this.findOne(notificationId);

      if (notification.status !== NotificationStatus.PENDING) {
        return;
      }

      // Update status to processing
      await this.update(notificationId, { status: NotificationStatus.SENT });

      // Send via all channels
      for (const channel of notification.channels) {
        try {
          await this.sendViaChannel(notification, channel);

          // Record successful delivery
          await this.recordDeliveryAttempt(notificationId, channel, 'success');
        } catch (error) {
          this.logger.error(`Failed to send via ${channel}: ${error.message}`);
          await this.recordDeliveryAttempt(
            notificationId,
            channel,
            'failed',
            error.message,
          );
        }
      }

      // Check if all channels succeeded
      const updatedNotification = await this.findOne(notificationId);
      const allSuccessful = updatedNotification.deliveryAttempts.every(
        (attempt) => attempt.status === 'success',
      );

      if (allSuccessful) {
        await this.update(notificationId, {
          status: NotificationStatus.DELIVERED,
          deliveredAt: new Date(),
        });
      } else {
        // Retry logic
        if (updatedNotification.retryCount < updatedNotification.maxRetries) {
          await this.update(notificationId, {
            retryCount: updatedNotification.retryCount + 1,
            status: NotificationStatus.PENDING,
          });

          // Schedule retry
          setTimeout(
            () => {
              this.sendNotification(notificationId).catch((error) => {
                this.logger.error(
                  `Retry failed for notification ${notificationId}: ${error.message}`,
                );
              });
            },
            Math.pow(2, updatedNotification.retryCount) * 1000,
          ); // Exponential backoff
        } else {
          await this.update(notificationId, {
            status: NotificationStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'Max retries exceeded',
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
      await this.update(notificationId, {
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
        failureReason: error.message,
      });
    }
  }

  private async sendViaChannel(
    notification: Notification,
    channel: NotificationChannel,
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmail(notification);
        break;
      case NotificationChannel.SMS:
        await this.sendSMS(notification);
        break;
      case NotificationChannel.PUSH:
        await this.sendPushNotification(notification);
        break;
      case NotificationChannel.IN_APP:
        await this.sendInAppNotification(notification);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhook(notification);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    // TODO: Implement email service integration (SendGrid, AWS SES, etc.)
    this.logger.log(
      `Sending email to user ${notification.userId}: ${notification.title}`,
    );

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async sendSMS(notification: Notification): Promise<void> {
    // TODO: Implement SMS service integration (Twilio, AWS SNS, etc.)
    this.logger.log(
      `Sending SMS to user ${notification.userId}: ${notification.message}`,
    );

    // Simulate SMS sending
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    // TODO: Implement push notification service (Firebase, OneSignal, etc.)
    this.logger.log(
      `Sending push notification to user ${notification.userId}: ${notification.title}`,
    );

    // Simulate push notification
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async sendInAppNotification(
    notification: Notification,
  ): Promise<void> {
    // In-app notifications are handled by the frontend
    this.logger.log(
      `In-app notification created for user ${notification.userId}: ${notification.title}`,
    );
  }

  private async sendWebhook(notification: Notification): Promise<void> {
    // TODO: Implement webhook delivery
    this.logger.log(
      `Webhook notification sent for user ${notification.userId}: ${notification.title}`,
    );

    // Simulate webhook delivery
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async recordDeliveryAttempt(
    notificationId: string,
    channel: NotificationChannel,
    status: 'success' | 'failed',
    error?: string,
  ): Promise<void> {
    const attempt = {
      timestamp: new Date(),
      channel,
      status,
      error,
    };

    await this.notificationModel.findByIdAndUpdate(notificationId, {
      $push: { deliveryAttempts: attempt },
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    return await this.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: {
          $in: [NotificationStatus.DELIVERED, NotificationStatus.SENT],
        },
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  async getNotificationStats(userId?: string): Promise<any> {
    try {
      const filter: any = {};
      if (userId) {
        filter.userId = new Types.ObjectId(userId);
      }

      const stats = await this.notificationModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            unreadNotifications: {
              $sum: {
                $cond: [
                  { $eq: ['$status', NotificationStatus.DELIVERED] },
                  1,
                  0,
                ],
              },
            },
            pendingNotifications: {
              $sum: {
                $cond: [{ $eq: ['$status', NotificationStatus.PENDING] }, 1, 0],
              },
            },
            failedNotifications: {
              $sum: {
                $cond: [{ $eq: ['$status', NotificationStatus.FAILED] }, 1, 0],
              },
            },
          },
        },
      ]);

      return (
        stats[0] || {
          totalNotifications: 0,
          unreadNotifications: 0,
          pendingNotifications: 0,
          failedNotifications: 0,
        }
      );
    } catch (error) {
      this.logger.error(`Error getting notification stats: ${error.message}`);
      throw new BadRequestException(
        'Failed to retrieve notification statistics',
      );
    }
  }

  // Convenience methods for common notification types
  async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string,
    vendorId?: string,
  ): Promise<Notification> {
    return await this.create({
      userId,
      vendorId,
      type: NotificationType.ORDER_STATUS,
      priority:
        status === 'cancelled' || status === 'rejected'
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      channel: NotificationChannel.IN_APP,
      title: `Order Status Update`,
      message: `Your order ${orderId} status has been updated to ${status}`,
      data: { orderId, status },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  async sendPaymentNotification(
    userId: string,
    paymentId: string,
    amount: number,
    status: string,
    vendorId?: string,
  ): Promise<Notification> {
    return await this.create({
      userId,
      vendorId,
      type: NotificationType.PAYMENT,
      priority:
        status === 'failed'
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      channel: NotificationChannel.IN_APP,
      title: `Payment ${status}`,
      message: `Payment ${paymentId} for $${amount} has been ${status}`,
      data: { paymentId, amount, status },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  async sendForecastNotification(
    userId: string,
    forecastId: string,
    type: string,
    vendorId?: string,
  ): Promise<Notification> {
    return await this.create({
      userId,
      vendorId,
      type: NotificationType.FORECAST,
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.IN_APP,
      title: `Forecast Ready`,
      message: `Your ${type} forecast is ready for review`,
      data: { forecastId, type },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }
}
