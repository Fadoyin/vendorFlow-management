import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  ORDER_STATUS = 'order_status',
  PAYMENT = 'payment',
  INVENTORY = 'inventory',
  FORECAST = 'forecast',
  SYSTEM = 'system',
  VENDOR_APPROVAL = 'vendor_approval',
  SUPPLIER_UPDATE = 'supplier_update',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId?: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({
    required: true,
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Prop({
    required: true,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop({ required: true, enum: NotificationChannel })
  channel: NotificationChannel;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: {
    orderId?: string;
    paymentId?: string;
    forecastId?: string;
    supplierId?: string;
    amount?: number;
    status?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  };

  @Prop({ type: [String], enum: Object.values(NotificationChannel) })
  channels: NotificationChannel[];

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop()
  retryCount: number;

  @Prop({ default: 3 })
  maxRetries: number;

  @Prop({ type: Object })
  deliveryAttempts: Array<{
    timestamp: Date;
    channel: NotificationChannel;
    status: 'success' | 'failed';
    error?: string;
  }>;

  @Prop({ type: Object })
  template?: {
    name: string;
    version: string;
    variables: Record<string, any>;
  };

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: Object })
  userPreferences?: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    quietHours?: {
      start: string; // HH:mm format
      end: string; // HH:mm format
      timezone: string;
    };
  };
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for better query performance
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ vendorId: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ channel: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ scheduledAt: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ vendorId: 1, status: 1 });
