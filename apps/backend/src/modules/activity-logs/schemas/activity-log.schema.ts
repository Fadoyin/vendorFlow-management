import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export enum ActivityType {
  ORDER = 'order',
  INVENTORY = 'inventory',
  VENDOR = 'vendor',
  SUPPLIER = 'supplier',
  PAYMENT = 'payment',
  USER = 'user',
  SYSTEM = 'system'
}

export enum ActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  PROCESSED = 'processed',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  RESTOCKED = 'restocked',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

@Schema({ timestamps: true })
export class ActivityLog extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ActivityType, required: true })
  type: ActivityType;

  @Prop({ type: String, enum: ActivityAction, required: true })
  action: ActivityAction;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, trim: true })
  entityId?: string;

  @Prop({ type: String, trim: true })
  entityType?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: String, trim: true })
  ipAddress?: string;

  @Prop({ type: String, trim: true })
  userAgent?: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog); 