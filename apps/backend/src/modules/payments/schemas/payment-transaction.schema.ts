import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

@Schema({ timestamps: true })
export class PaymentTransaction extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Vendor' })
  vendorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId?: Types.ObjectId;

  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true })
  stripePaymentIntentId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ required: true, enum: PaymentType })
  paymentType: PaymentType;

  @Prop()
  description?: string;

  @Prop()
  receiptUrl?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  failureCode?: string;

  @Prop()
  refundReason?: string;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundedAt?: Date;

  @Prop()
  processedAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  customerEmail?: string;

  @Prop()
  customerName?: string;

  @Prop({ type: Object })
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Prop({ type: Object })
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Prop()
  invoiceId?: string;

  @Prop()
  invoiceUrl?: string;

  @Prop()
  statementDescriptor?: string;

  @Prop()
  captureMethod?: string;

  @Prop()
  confirmationMethod?: string;

  @Prop()
  setupFutureUsage?: string;

  @Prop({ type: Object })
  lastPaymentError?: {
    code: string;
    message: string;
    param?: string;
    type: string;
  };

  @Prop({ type: Object })
  nextAction?: {
    type: string;
    redirectToUrl?: string;
    useStripeSdk?: boolean;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String] })
  tags?: string[];
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);

// Indexes for better query performance
PaymentTransactionSchema.index({ vendorId: 1 });
PaymentTransactionSchema.index({ subscriptionId: 1 });
PaymentTransactionSchema.index({ transactionId: 1 });
PaymentTransactionSchema.index({ stripePaymentIntentId: 1 });
PaymentTransactionSchema.index({ status: 1 });
PaymentTransactionSchema.index({ paymentType: 1 });
PaymentTransactionSchema.index({ createdAt: -1 });
PaymentTransactionSchema.index({ amount: -1 });
PaymentTransactionSchema.index({ vendorId: 1, status: 1 });
PaymentTransactionSchema.index({ vendorId: 1, createdAt: -1 });
