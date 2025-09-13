import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  plan: string; // Changed from enum to string to support custom plan IDs

  @Prop({
    required: true,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Prop()
  stripeCustomerId?: string; // Made optional for free plans

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  stripePriceId?: string;

  @Prop({ required: true, min: 0 })
  amount: number; // Renamed from monthlyPrice to amount

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop()
  billingPeriod?: string; // monthly, yearly

  @Prop()
  trialStartDate?: Date;

  @Prop()
  trialEndDate?: Date;

  @Prop()
  currentPeriodStart?: Date;

  @Prop()
  currentPeriodEnd?: Date;

  @Prop()
  cancelAtPeriodEnd?: boolean;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  endedAt?: Date;

  @Prop()
  nextBillingDate?: Date;

  @Prop({ default: 0 })
  totalBilled: number;

  @Prop({ default: 0 })
  totalPaid: number;

  @Prop({ default: 0 })
  outstandingAmount: number;

  @Prop({ type: [String] })
  features: string[];

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastPaymentDate?: Date;

  @Prop()
  lastPaymentAmount?: number;

  @Prop()
  nextPaymentDate?: Date;

  @Prop()
  paymentMethod?: string;

  @Prop()
  autoRenew?: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes for better query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });
