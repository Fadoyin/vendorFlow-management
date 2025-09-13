import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  DISPATCHED = 'dispatched',
  ENROUTE = 'enroute',
  ARRIVED = 'arrived',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Inventory' })
  inventoryId: Types.ObjectId;

  @Prop({ required: true })
  stockName: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, type: Types.ObjectId })
  tenantId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Vendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Supplier' })
  supplierId: Types.ObjectId;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Prop({ required: true, enum: OrderPriority, default: OrderPriority.MEDIUM })
  priority: OrderPriority;

  @Prop({ required: true })
  orderDate: Date;

  @Prop()
  expectedArrivalDate?: Date;

  @Prop()
  actualArrivalDate?: Date;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ default: 0, min: 0 })
  shipping: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop()
  currency?: string;

  @Prop()
  paymentTerms?: string;

  @Prop()
  shippingAddress?: string;

  @Prop()
  billingAddress?: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  carrier?: string;

  @Prop()
  notes?: string;

  @Prop()
  internalNotes?: string;

  @Prop({ type: [String] })
  attachments?: string[];

  @Prop()
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedBy?: Types.ObjectId;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  statusHistory?: Array<{
    status: OrderStatus;
    timestamp: Date;
    updatedBy: Types.ObjectId;
    notes?: string;
  }>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for better query performance
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ vendorId: 1 });
OrderSchema.index({ supplierId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ expectedArrivalDate: 1 });
OrderSchema.index({ priority: 1 });
